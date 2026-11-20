import * as faceapi from '@vladmandic/face-api';
import { CONFIDENCE_THRESHOLD, type Expression } from './expressions';

const MODEL_URL = `${import.meta.env.BASE_URL}models`;

let loading: Promise<void> | null = null;

/** Loads the face detector + expression models once. Safe to call many times. */
export function loadModels(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
    })().catch((err) => {
      loading = null; // allow retry
      throw err;
    });
  }
  return loading;
}

interface BoxLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function boxColor(name: Expression, value: number): string {
  if (value < CONFIDENCE_THRESHOLD) return '#e2e8f0';
  if (name === 'happy') return '#22c55e';
  if (name === 'sad') return '#60a5fa';
  return '#e2e8f0';
}

/** Draws a rounded rectangle around the detected face. */
export function drawBox(ctx: CanvasRenderingContext2D, box: BoxLike, color: string): void {
  const { x, y, width, height } = box;
  const r = Math.min(24, width / 4, height / 4);

  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.stroke();
}
