import type { Dict } from '../i18n';

interface Props {
  t: Dict;
  paused: boolean;
  mirror: boolean;
  canSwitch: boolean;
  onSwitchCamera: () => void;
  onTogglePause: () => void;
  onToggleMirror: () => void;
  onToggleLang: () => void;
  onStop: () => void;
}

export function Controls({
  t,
  paused,
  mirror,
  canSwitch,
  onSwitchCamera,
  onTogglePause,
  onToggleMirror,
  onToggleLang,
  onStop,
}: Props) {
  return (
    <div className="controls">
      {canSwitch && (
        <button type="button" className="btn" onClick={onSwitchCamera}>
          🔄 {t.controls.switchCamera}
        </button>
      )}
      <button type="button" className="btn" onClick={onTogglePause}>
        {paused ? `▶️ ${t.controls.resume}` : `⏸️ ${t.controls.pause}`}
      </button>
      <button
        type="button"
        className={`btn${mirror ? ' btn--on' : ''}`}
        aria-pressed={mirror}
        onClick={onToggleMirror}
      >
        🪞 {t.controls.mirror}
      </button>
      <button type="button" className="btn" onClick={onToggleLang}>
        🌐 {t.languageName}
      </button>
      <button type="button" className="btn btn--danger" onClick={onStop}>
        ⏹️ {t.controls.stop}
      </button>
    </div>
  );
}
