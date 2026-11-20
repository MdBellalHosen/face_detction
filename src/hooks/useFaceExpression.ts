import { useEffect, useRef, useState, type RefObject } from 'react';
import { boxColor, drawBox, loadModels, type FaceApi } from '../lib/faceApi';
import { createSmoother } from '../lib/smoothing';
import { EXPRESSIONS, topExpression, type Scores } from '../lib/expressions';

/** Run at most ~10 detections per second; faster devices simply wait, slower ones go as fast as they can. */
const TARGET_FRAME_MS = 100;
/** Larger input = more accurate face finding (160 was too small, 224 is a good speed/accuracy balance). */
const INPUT_SIZE = 224;
const DETECTION_THRESHOLD = 0.4;
const MISSES_BEFORE_LOST = 5; // ~0.5s without a face before we say "face not found"

export type ModelsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface DetectionState {
  scores: Scores | null;
  faceFound: boolean;
}

interface Options {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  /** Start loading the AI library + models (can be true from the first screen to preload). */
  enabled: boolean;
  cameraActive: boolean;
  paused: boolean;
}

export function useFaceExpression({ videoRef, canvasRef, enabled, cameraActive, paused }: Options) {
  const [modelsStatus, setModelsStatus] = useState<ModelsStatus>('idle');
  const [attempt, setAttempt] = useState(0);
  const [detection, setDetection] = useState<DetectionState>({ scores: null, faceFound: false });
  const smootherRef = useRef(createSmoother(5));
  const apiRef = useRef<FaceApi | null>(null);

  // 1. Load library + models
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setModelsStatus((prev) => (prev === 'ready' ? prev : 'loading'));
    loadModels()
      .then((api) => {
        apiRef.current = api;
        if (!cancelled) setModelsStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setModelsStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  // 2. Detection loop
  useEffect(() => {
    const api = apiRef.current;
    if (modelsStatus !== 'ready' || !api || !cameraActive || paused) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let misses = 0;
    const options = new api.TinyFaceDetectorOptions({
      inputSize: INPUT_SIZE,
      scoreThreshold: DETECTION_THRESHOLD,
    });

    const tick = async () => {
      const started = performance.now();
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Skip work while the tab is hidden (saves battery).
      if (!document.hidden && video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          const result = await api.detectSingleFace(video, options).withFaceExpressions();
          if (cancelled) return;

          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);

          if (result) {
            misses = 0;
            const raw = {} as Scores;
            for (const key of EXPRESSIONS) raw[key] = result.expressions[key];

            const smooth = smootherRef.current.push(raw);
            const top = topExpression(smooth);
            if (ctx) drawBox(ctx, result.detection.box, boxColor(top.name, top.value));
            setDetection({ scores: smooth, faceFound: true });
          } else {
            misses += 1;
            if (misses >= MISSES_BEFORE_LOST) {
              smootherRef.current.reset();
              setDetection((prev) =>
                prev.faceFound || prev.scores ? { scores: null, faceFound: false } : prev,
              );
            }
          }
        } catch {
          /* skip this frame */
        }
      }

      if (!cancelled) {
        const wait = Math.max(0, TARGET_FRAME_MS - (performance.now() - started));
        timer = setTimeout(tick, wait);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [modelsStatus, cameraActive, paused, videoRef, canvasRef]);

  // 3. Reset everything when the camera stops
  useEffect(() => {
    if (cameraActive) return;
    smootherRef.current.reset();
    setDetection({ scores: null, faceFound: false });
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }, [cameraActive, canvasRef]);

  return {
    modelsStatus,
    detection,
    retryModels: () => setAttempt((n) => n + 1),
  };
}
