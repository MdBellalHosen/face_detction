import type { Dict } from '../i18n';
import {
  CONFIDENCE_THRESHOLD,
  EMOJI,
  happySadMeter,
  topExpression,
  type Scores,
} from '../lib/expressions';

interface Props {
  t: Dict;
  scores: Scores | null;
  faceFound: boolean;
}

export function ResultCard({ t, scores, faceFound }: Props) {
  if (!faceFound || !scores) {
    return (
      <section className="result result--idle" aria-live="polite">
        <div className="result__emoji" aria-hidden="true">
          🔍
        </div>
        <p className="result__hint">{t.noFace}</p>
      </section>
    );
  }

  const top = topExpression(scores);
  const confident = top.value >= CONFIDENCE_THRESHOLD;
  const meter = happySadMeter(scores);
  const tone = confident && (top.name === 'happy' || top.name === 'sad') ? ` result--${top.name}` : '';

  return (
    <section className={`result${tone}`} aria-live="polite">
      <div className="result__emoji" aria-hidden="true">
        {confident ? EMOJI[top.name] : '🤔'}
      </div>
      <h2 className="result__label">{confident ? t.expressions[top.name] : t.uncertain}</h2>
      {confident && (
        <p className="result__conf">
          {t.confidence}: {Math.round(top.value * 100)}%
        </p>
      )}

      <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={meter}>
        <div className="meter__track">
          <div className="meter__thumb" style={{ left: `${meter}%` }} />
        </div>
        <div className="meter__labels">
          <span>😢 {t.sad}</span>
          <span className="meter__value">{meter}%</span>
          <span>{t.happy} 😄</span>
        </div>
      </div>
    </section>
  );
}
