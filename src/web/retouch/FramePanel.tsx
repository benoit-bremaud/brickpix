import { MAX_ZOOM, NEUTRAL_FRAMING, type Framing, type QuarterTurns } from "../../domain/crop";
import { MAX_PLATES, type MosaicSize } from "../../domain/mosaic";

/** Plate count typed or stepped, kept in 1..MAX_PLATES. */
export function clampPlates(value: string | number): number {
  const plates = Math.round(Number(value));
  return Number.isFinite(plates) ? Math.min(MAX_PLATES, Math.max(1, plates)) : 1;
}

function PlatesField({ label, value, onChange }: Readonly<{ label: string; value: number; onChange: (plates: number) => void }>) {
  return (
    <div className="stepper">
      <button type="button" aria-label={`${label} −1`} disabled={value <= 1} onClick={() => onChange(clampPlates(value - 1))}>−</button>
      <label>{label}<input type="number" min={1} max={MAX_PLATES} value={value} onChange={(event) => onChange(clampPlates(event.target.value))} /></label>
      <button type="button" aria-label={`${label} +1`} disabled={value >= MAX_PLATES} onClick={() => onChange(clampPlates(value + 1))}>+</button>
    </div>
  );
}

type Props = {
  size: MosaicSize;
  framing: Framing;
  onSize: (size: MosaicSize) => void;
  onFraming: (framing: Framing) => void;
};

/** «Cadrer»: size, zoom, quarter turn, mirror and recentre; drag and pinch happen on the canvas. */
export function FramePanel({ size, framing, onSize, onFraming }: Readonly<Props>) {
  return (
    <div className="panel">
      <PlatesField label="Largeur (plaques)" value={size.platesWide} onChange={(platesWide) => onSize({ ...size, platesWide })} />
      <PlatesField label="Hauteur (plaques)" value={size.platesHigh} onChange={(platesHigh) => onSize({ ...size, platesHigh })} />
      <label className="slider">Zoom<input type="range" min={1} max={MAX_ZOOM} step={0.1} value={framing.zoom} onChange={(event) => onFraming({ ...framing, zoom: Number(event.target.value) })} /></label>
      <button type="button" onClick={() => onFraming({ ...framing, quarterTurns: ((framing.quarterTurns + 1) % 4) as QuarterTurns })}>↻ Pivoter</button>
      <button type="button" aria-pressed={framing.mirrored} onClick={() => onFraming({ ...framing, mirrored: !framing.mirrored })}>⇆ Miroir</button>
      <button type="button" onClick={() => onFraming({ ...NEUTRAL_FRAMING, quarterTurns: framing.quarterTurns, mirrored: framing.mirrored })}>Recentrer</button>
    </div>
  );
}
