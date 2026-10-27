import { BACKGROUND_TOLERANCE, type Background } from "../../domain/background";
import type { RetouchSettings } from "../../domain/retouch";

type Props = {
  settings: RetouchSettings;
  onSettings: (settings: RetouchSettings) => void;
};

/** «Fond»: the switch, and the tolerance slider once it is on. */
export function BackgroundPanel({ settings, onSettings }: Readonly<Props>) {
  const { background } = settings;
  const set = (change: Partial<Background>) => onSettings({ ...settings, background: { ...background, ...change } });
  return (
    <div className="panel">
      <label className="toggle"><input type="checkbox" role="switch" checked={background.enabled} onChange={(event) => set({ enabled: event.target.checked })} />Fond uni</label>
      {background.enabled && (
        <label className="slider">
          {"Tolérance"}
          <input type="range" min={BACKGROUND_TOLERANCE.min} max={BACKGROUND_TOLERANCE.max} step={1} value={background.tolerance} onChange={(event) => set({ tolerance: Number(event.target.value) })} />
          <output>{background.tolerance}</output>
        </label>
      )}
    </div>
  );
}
