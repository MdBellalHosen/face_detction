# MoodCam 😊😢

🌐 **Live demo:** https://face-detction.vercel.app

Real-time face expression detection in the browser. Point the camera at your face and MoodCam tells you whether you look **Happy** or **Sad** (plus Neutral, Angry, Surprised, Fearful, Disgusted).

- Runs **fully on your device**. Video never leaves your phone or laptop.
- Installable as a **PWA** on Android and iOS, and **Capacitor-ready** for native apps.
- English and বাংলা (Bangla) UI.

**Stack:** Vite · React · TypeScript · [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) (TinyFaceDetector + FaceExpressionNet) · `vite-plugin-pwa`

## How it works

1. The camera stream is shown in a `<video>` (`playsInline`, `muted`, `autoPlay` for iOS Safari).
2. Every ~200 ms the detector finds the face and scores 7 expressions.
3. Scores are averaged over the last 5 frames so the label does not flicker.
4. If the top score is below 0.5, the app shows "Not sure" instead of guessing.
5. The Happy ↔ Sad meter is `happy / (happy + sad)`, from 0% (sad) to 100% (happy).

## Project structure

```
face_detction/
├── public/
│   ├── models/                    # face-api model files (auto-downloaded)
│   ├── icons/                     # PWA icons (192, 512, maskable, apple-touch)
│   └── favicon.svg
├── scripts/
│   └── download-models.mjs        # downloads models on `npm install`
├── src/
│   ├── components/
│   │   ├── StartScreen.tsx
│   │   ├── CameraView.tsx         # video + canvas overlay
│   │   ├── ResultCard.tsx         # emoji, label, happy/sad meter
│   │   ├── ExpressionBars.tsx     # confidence bar per expression
│   │   └── Controls.tsx           # switch camera, pause, mirror, language, stop
│   ├── hooks/
│   │   ├── useCamera.ts
│   │   └── useFaceExpression.ts
│   ├── lib/
│   │   ├── faceApi.ts             # model loading + face box drawing
│   │   ├── smoothing.ts           # 5-frame moving average
│   │   └── expressions.ts         # expression names, emoji, threshold, meter
│   ├── i18n/                      # en.ts, bn.ts, index.ts
│   ├── styles/app.css
│   ├── App.tsx
│   └── main.tsx
├── capacitor.config.ts
├── index.html
├── vite.config.ts                 # includes vite-plugin-pwa
├── tsconfig.json
└── package.json
```

## Run locally

Requires Node.js 18+.

```bash
npm install        # also downloads the models into public/models
npm run dev
```

Open the printed URL. Camera works on `localhost` without HTTPS.

If the models failed to download (offline, firewall), run `npm run models` again.

To test on your phone during development, the phone needs **HTTPS** for camera access. The easiest way is to deploy (below) or use a tunnel such as `ngrok http 5173`.

## Build

```bash
npm run build      # type-check + production build into dist/
npm run preview    # serve the build locally
```

## Deploy (HTTPS is required for the camera)

**Netlify**
1. Push this repo to GitHub.
2. Netlify → *Add new site* → *Import from Git* → pick this repo.
3. Build command: `npm run build`, publish directory: `dist`.

**Vercel**
1. Vercel → *Add New Project* → import this repo.
2. Framework preset: **Vite** (build `npm run build`, output `dist`).

Both give you a free HTTPS URL.

## Install as an app (PWA)

Deploy first, then open the HTTPS URL on your phone.

- **Android (Chrome):** menu ⋮ → **Install app** (or *Add to Home screen*).
- **iPhone / iPad (Safari only):** Share button → **Add to Home Screen**.

The app opens full screen with its own icon, and works offline after the first load because the app shell and model files are cached by the service worker.

## Native apps with Capacitor (optional)

`capacitor.config.ts` is ready (`appId: com.example.moodcam`). Change the `appId` to your own before publishing. Native platforms are not added yet.

```bash
npm install @capacitor/android @capacitor/ios
npm run build
npx cap add android
npx cap add ios
npm run cap:sync      # build + copy web assets into the native projects
npm run cap:android   # opens Android Studio
npm run cap:ios       # opens Xcode (macOS only)
```

### Required camera permissions

**Android**, in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

**iOS**, in `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>MoodCam uses the camera to detect your facial expression. Video never leaves your device.</string>
```

Without these, the camera will not start in the native app.

### Store requirements

- iOS builds need a Mac with Xcode. Publishing to the App Store needs an Apple Developer account (US$99/year).
- Publishing to Google Play needs a Play Console account (one-time US$25).

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run models` | Re-download face-api model files |
| `npm run cap:sync` | Build and sync into native projects |
| `npm run cap:android` | Open the Android project |
| `npm run cap:ios` | Open the iOS project |

## Limitations

- This is a basic emotion model. Poor lighting, glasses, masks, or a face turned away can give wrong results.
- "Sad" is subtle and is the least accurate class.
- It guesses a facial expression only, not how a person actually feels.

## Credits

Models and library by [vladmandic/face-api](https://github.com/vladmandic/face-api).
