import { useMemo, useState, type RefObject } from "react";

import { cropFor, orient, type Framing } from "../../domain/crop";
import { studsOf, type Mosaic, type MosaicSize, type RgbaImage } from "../../domain/mosaic";
import { autoTone, NEUTRAL_RETOUCH, type RetouchSettings } from "../../domain/retouch";
import { computeMosaic, studsFor } from "../chain";
import { usePreview, type View } from "../usePreview";
import { BackgroundPanel } from "./BackgroundPanel";
import { FramePanel } from "./FramePanel";
import { TonePanel } from "./TonePanel";
import { Toolbar, type Tool } from "./Toolbar";
import { useFrameGestures } from "./useFrameGestures";

type Props = {
  source: RgbaImage;
  size: MosaicSize;
  onSize: (size: MosaicSize) => void;
  dithering: boolean;
  onDithering: (dithering: boolean) => void;
  hidden: boolean; // the kit shows; the canvas keeps its drawing
  preparing: boolean; // the kit is computed: inputs are inert (spec kit.md)
  onOrder: (compute: () => Mosaic) => void;
  orderButton: RefObject<HTMLButtonElement | null>;
};

function sizeSummary(size: MosaicSize): string {
  const studs = studsOf(size);
  const tiles = (studs.width * studs.height).toLocaleString("fr-FR");
  return `${size.platesWide} × ${size.platesHigh} plaques · ${studs.width} × ${studs.height} tenons · ${tiles} tuiles`;
}

function hintFor(view: View, hinted: boolean): string {
  if (view === "frame") return "Glissez pour déplacer le cadre, tirez ses poignées pour changer la taille, pincez pour zoomer.";
  return hinted ? "" : "Appui long (ou Espace) sur l'aperçu : photo d'origine.";
}

type PanelProps = Pick<Props, "size" | "onSize" | "dithering" | "onDithering"> & {
  tool: Tool | undefined;
  settings: RetouchSettings;
  onSettings: (settings: RetouchSettings) => void;
  onAuto: () => void;
};

/** The panel of the open tool, if any. */
function ToolPanel({ tool, size, onSize, settings, onSettings, dithering, onDithering, onAuto }: PanelProps) {
  const onFraming = (framing: Framing) => onSettings({ ...settings, framing });
  if (tool === "frame") return <FramePanel size={size} framing={settings.framing} onSize={onSize} onFraming={onFraming} />;
  if (tool === "tone") return <TonePanel settings={settings} dithering={dithering} onSettings={onSettings} onAuto={onAuto} onDithering={onDithering} />;
  if (tool === "background") return <BackgroundPanel settings={settings} onSettings={onSettings} />;
  return null;
}

/**
 * The retouch workspace of one photo: preview canvas, tool panels and the order button. The editor
 * remounts it for each new photo, which resets the retouch settings and opens «Cadrer» (05-state).
 */
export function Workspace({ source, size, onSize, dithering, onDithering, hidden, preparing, onOrder, orderButton }: Readonly<Props>) {
  const [settings, setSettings] = useState<RetouchSettings>(NEUTRAL_RETOUCH);
  const [tool, setTool] = useState<Tool | undefined>("frame");
  const [before, setBefore] = useState(false);
  const [hinted, setHinted] = useState(false);
  const { quarterTurns, mirrored } = settings.framing;
  const oriented = useMemo(() => orient(source, quarterTurns, mirrored), [source, quarterTurns, mirrored]);
  let view: View = before ? "before" : "mosaic";
  if (tool === "frame") view = "frame";
  const canvas = usePreview({ oriented, size, settings, dithering, view }, preparing || hidden);
  const gestures = useFrameGestures(canvas, {
    framing: view === "frame",
    image: oriented,
    crop: cropFor(oriented.width, oriented.height, size, settings.framing),
    size,
    settings: settings.framing,
    onFraming: (framing) => setSettings((current) => ({ ...current, framing })),
    onSize,
    onBefore: (shown) => {
      setBefore(shown);
      setHinted((was) => was || shown);
    },
  });
  const onAuto = () => setSettings((current) => ({ ...current, ...autoTone(studsFor(oriented, size, current.framing)) }));
  const panel = { tool, size, onSize, settings, onSettings: setSettings, dithering, onDithering, onAuto };

  return (
    <figure className="preview-figure" aria-labelledby="preview-caption" hidden={hidden}>
      <figcaption id="preview-caption">Aperçu</figcaption>
      <canvas ref={canvas} className="preview" data-view={view} tabIndex={0} aria-describedby="preview-help" {...gestures}>Aperçu de la mosaïque en tuiles rondes.</canvas>
      <p id="preview-help" className="hint">{hintFor(view, hinted)}</p>
      <div className="controls" inert={preparing}>
        <ToolPanel {...panel} />
        <Toolbar tool={tool} size={size} onTool={setTool} />
      </div>
      <p className="size-summary">{sizeSummary(size)}</p>
      <button ref={orderButton} type="button" className="order" disabled={preparing} onClick={() => onOrder(() => computeMosaic(oriented, size, settings, { dithering }))}>Commander mon kit</button>
      <output className="status">{preparing ? "Préparation du kit…" : ""}</output>
    </figure>
  );
}
