export const EXPRESSIONS = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'fearful',
  'disgusted',
  'surprised',
] as const;

export type Expression = (typeof EXPRESSIONS)[number];
export type Scores = Record<Expression, number>;

export const EMOJI: Record<Expression, string> = {
  neutral: '😐',
  happy: '😄',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  disgusted: '🤢',
  surprised: '😮',
};

/** Below this confidence the app shows "Not sure" instead of a label. */
export const CONFIDENCE_THRESHOLD = 0.5;

export function topExpression(scores: Scores): { name: Expression; value: number } {
  let name: Expression = 'neutral';
  let value = -1;
  for (const key of EXPRESSIONS) {
    if (scores[key] > value) {
      name = key;
      value = scores[key];
    }
  }
  return { name, value };
}

/** 0 = fully sad, 100 = fully happy, 50 = neither (or both equal). */
export function happySadMeter(scores: Scores): number {
  const total = scores.happy + scores.sad;
  if (total < 0.02) return 50;
  return Math.round((scores.happy / total) * 100);
}
