import { EXPRESSIONS, type Scores } from './expressions';

/** Moving average over the last `size` frames so the label does not flicker. */
export function createSmoother(size = 5) {
  const buffer: Scores[] = [];

  return {
    push(scores: Scores): Scores {
      buffer.push(scores);
      if (buffer.length > size) buffer.shift();

      const avg = {} as Scores;
      for (const key of EXPRESSIONS) {
        let sum = 0;
        for (const frame of buffer) sum += frame[key];
        avg[key] = sum / buffer.length;
      }
      return avg;
    },
    reset() {
      buffer.length = 0;
    },
  };
}
