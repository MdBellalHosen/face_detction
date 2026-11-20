import { useCallback, useEffect, useRef, useState } from 'react';
import { getInitialLang, saveLang, translations, type Lang } from './i18n';
import { useCamera } from './hooks/useCamera';
import { useFaceExpression } from './hooks/useFaceExpression';
import { StartScreen } from './components/StartScreen';
import { CameraView } from './components/CameraView';
import { ResultCard } from './components/ResultCard';
import { ExpressionBars } from './components/ExpressionBars';
import { Controls } from './components/Controls';

export default function App() {
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mirror, setMirror] = useState(true);
  const t = translations[lang];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camera = useCamera();
  const { start, stop } = camera;
  const cameraActive = camera.status === 'active';

  const { modelsStatus, detection, retryModels } = useFaceExpression({
    videoRef: camera.videoRef,
    canvasRef,
    enabled: true, // preload the AI in the background while the user is on the first screen
    cameraActive,
    paused,
  });

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'en' ? 'bn' : 'en';
      saveLang(next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Start the camera once the camera screen (and its <video>) is mounted.
  useEffect(() => {
    if (!started) return;
    void start();
    return () => stop();
  }, [started, start, stop]);

  // Selfie camera is mirrored by default, back camera is not.
  useEffect(() => {
    setMirror(camera.facing === 'user');
  }, [camera.facing]);

  const handleStop = () => {
    setPaused(false);
    setStarted(false);
  };

  if (!started) {
    return (
      <main className="app">
        <StartScreen t={t} onStart={() => setStarted(true)} onToggleLang={toggleLang} />
      </main>
    );
  }

  const cameraError = camera.status === 'error' && camera.error ? t.errors[camera.error] : null;

  return (
    <main className="app">
      <header className="header">
        <h1 className="header__title">😊 {t.appName}</h1>
      </header>

      <CameraView
        videoRef={camera.videoRef}
        canvasRef={canvasRef}
        mirror={mirror}
        paused={paused}
        active={cameraActive}
      >
        {camera.status === 'starting' && <div className="overlay">{t.cameraStarting}</div>}
        {cameraActive && modelsStatus === 'loading' && (
          <div className="overlay overlay--soft">{t.loadingModels}</div>
        )}
        {cameraError && (
          <div className="overlay overlay--error">
            <p>{cameraError}</p>
            {camera.error !== 'unsupported' && (
              <button type="button" className="btn btn--primary" onClick={() => void start()}>
                {t.retry}
              </button>
            )}
          </div>
        )}
        {modelsStatus === 'error' && (
          <div className="overlay overlay--error">
            <p>{t.modelsError}</p>
            <button type="button" className="btn btn--primary" onClick={retryModels}>
              {t.retry}
            </button>
          </div>
        )}
      </CameraView>

      <ResultCard t={t} scores={detection.scores} faceFound={detection.faceFound} />
      <ExpressionBars t={t} scores={detection.scores} />

      <Controls
        t={t}
        paused={paused}
        mirror={mirror}
        canSwitch={camera.canSwitch}
        onSwitchCamera={camera.switchCamera}
        onTogglePause={() => setPaused((p) => !p)}
        onToggleMirror={() => setMirror((m) => !m)}
        onToggleLang={toggleLang}
        onStop={handleStop}
      />
    </main>
  );
}
