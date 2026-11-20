import type { Dict } from '../i18n';

interface Props {
  t: Dict;
  onStart: () => void;
  onToggleLang: () => void;
}

export function StartScreen({ t, onStart, onToggleLang }: Props) {
  return (
    <section className="start">
      <button type="button" className="btn btn--ghost start__lang" onClick={onToggleLang}>
        🌐 {t.languageName}
      </button>
      <div className="start__logo" aria-hidden="true">
        😊
      </div>
      <h1 className="start__title">{t.appName}</h1>
      <p className="start__tagline">{t.tagline}</p>
      <button type="button" className="btn btn--primary btn--big" onClick={onStart}>
        📷 {t.start}
      </button>
      <p className="note">🔒 {t.privacy}</p>
    </section>
  );
}
