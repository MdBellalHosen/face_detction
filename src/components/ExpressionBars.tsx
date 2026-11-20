import type { Dict } from '../i18n';
import { EMOJI, EXPRESSIONS, type Scores } from '../lib/expressions';

interface Props {
  t: Dict;
  scores: Scores | null;
}

export function ExpressionBars({ t, scores }: Props) {
  return (
    <ul className="bars">
      {EXPRESSIONS.map((name) => {
        const pct = scores ? Math.round(scores[name] * 100) : 0;
        return (
          <li key={name} className="bars__row">
            <span className="bars__name">
              {EMOJI[name]} {t.expressions[name]}
            </span>
            <span className="bars__track">
              <span className={`bars__fill bars__fill--${name}`} style={{ width: `${pct}%` }} />
            </span>
            <span className="bars__pct">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}
