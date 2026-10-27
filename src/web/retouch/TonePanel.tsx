import { useState } from "react";

import { MOODS, type RetouchSettings, type Tone } from "../../domain/retouch";

function Slider({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
  return (
    <label className="slider">
      {label}
      <input type="range" min={min} max={100} step={1} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <output>{value}</output>
    </label>
  );
}

const sameTone = (a: Tone, b: Tone) => a.brightness === b.brightness && a.contrast === b.contrast && a.saturation === b.saturation;

type Props = {
  settings: RetouchSettings;
  dithering: boolean;
  onSettings: (settings: RetouchSettings) => void;
  onAuto: () => void;
  onDithering: (dithering: boolean) => void;
};

/** «Ambiance»: Auto and the moods fill the sliders, which «Plus» reveals with the dithering toggle. */
export function TonePanel({ settings, dithering, onSettings, onAuto, onDithering }: Props) {
  const [more, setMore] = useState(false);
  const set = (key: "brightness" | "contrast" | "saturation" | "sharpen") => (value: number) => onSettings({ ...settings, [key]: value });
  return (
    <div className="panel">
      <button type="button" onClick={onAuto}>Auto</button>
      {MOODS.map((mood) => (
        <button key={mood.name} type="button" aria-pressed={sameTone(settings, mood.tone)} onClick={() => onSettings({ ...settings, ...mood.tone })}>{mood.name}</button>
      ))}
      <button type="button" aria-expanded={more} onClick={() => setMore(!more)}>Plus {more ? "▴" : "▾"}</button>
      {more && (
        <div className="panel-more">
          <Slider label="Luminosité" value={settings.brightness} min={-100} onChange={set("brightness")} />
          <Slider label="Contraste" value={settings.contrast} min={-100} onChange={set("contrast")} />
          <Slider label="Saturation" value={settings.saturation} min={-100} onChange={set("saturation")} />
          <Slider label="Netteté" value={settings.sharpen} min={0} onChange={set("sharpen")} />
          <label className="toggle"><input type="checkbox" checked={dithering} onChange={(event) => onDithering(event.target.checked)} />Tramage</label>
        </div>
      )}
    </div>
  );
}
