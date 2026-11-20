import { useEffect, useRef, useState, type RefObject } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { boxColor, drawBox, loadModels } from '../lib/faceApi';
import { createSmoother } from '../lib/smoothing';
import { EXPRESSIONS, topExpression, type Scores } from '../lib/expressions';

const INTERVAL_MS = 200;
const MISSES_BEFORE_LOST = 3; // ~0.6s without a face before we say "face not found"

export type ModelsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface DetectionState {
  scores: Scores | null;
  faceFound: boolean;
}

interface Options {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  /** Start loading the AI models (true once the user pressed Start). */
  enabled: boolean;
  cameraActive: boolean;
  paused: boolean;
}

export function useFaceExpression({ videoRef, canvasRef, enabled, cameraActive, paused }: Options) {
  const [modelsStatus, setModelsStatus] = useState<ModelsStatus>('idle');
  const [attempt, setAttempt] = useState(0);
  const [detection, setDetection] = useState<DetectionState>({ scores: null, faceFound: false });
  const smootherRef = useRef(createSmoother(5));

  // 1. Load models
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setModelsStatus('loading');
    loadModels()
      .then(() => {
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
    if (modelsStatus !== 'ready' || !cameraActive || paused) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let misses = 0;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

    const tick = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          const result = await faceapi.detectSingleFace(video, options).withFaceExpressions();
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

      if (!cancelled) timer = setTimeout(tick, INTERVAL_MS);
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
