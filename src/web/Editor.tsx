import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { defaultCrop } from "../domain/crop";
import { DEFAULT_SIZE, MAX_PLATES, type Mosaic, type MosaicSize, type RgbaImage } from "../domain/mosaic";
import { ROUND_TILE_PALETTE } from "../domain/palette";
import { quantise, type QuantiseOptions } from "../domain/quantise";
import { resample } from "../domain/resample";
import { decodeFile } from "./canvas/imageIO";
import { renderMosaic } from "./canvas/renderMosaic";
import { Kit } from "./kit/Kit";

/** Delay between the last size or dithering change and the preview refresh. */
export const PREVIEW_DEBOUNCE_MS = 150;

/** The photo-to-mosaic chain of spec quantise-mosaic.md: default crop, resample, quantise. */
export function computeMosaic(source: RgbaImage, size: MosaicSize, options: QuantiseOptions): Mosaic {
  const studs = resample(source, defaultCrop(source.width, source.height, size), size);
  return quantise(studs, size, ROUND_TILE_PALETTE, options);
}

function clampPlates(value: string): number {
  const plates = Math.round(Number(value));
  return Number.isFinite(plates) ? Math.min(MAX_PLATES, Math.max(1, plates)) : 1;
}

/** Recomputes and draws the preview, debounced except right after an import. */
function usePreview(source: RgbaImage | undefined, size: MosaicSize, dithering: boolean) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef<RgbaImage | undefined>(undefined);
  useEffect(() => {
    if (source === undefined) return;
    const draw = () => {
      shown.current = source;
      if (canvas.current !== null) renderMosaic(canvas.current, computeMosaic(source, size, { dithering }));
    };
    if (shown.current !== source) {
      draw();
      return;
    }
    const timer = setTimeout(draw, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [source, size, dithering]);
  return canvas;
}

/** The decoded photo and the last decode error; only the latest import wins. */
function useImport() {
  const [source, setSource] = useState<RgbaImage>();
  const [error, setError] = useState<string>();
  const latestImport = useRef(0);

  const importFile = async (file: File | undefined) => {
    if (file === undefined) return;
    const id = ++latestImport.current;
    try {
      const image = await decodeFile(file);
      if (id !== latestImport.current) return; // a newer import superseded this one
      setSource(image);
      setError(undefined);
    } catch {
      if (id !== latestImport.current) return;
      setError("Impossible de lire cette image. Essayez un fichier JPEG, PNG ou WebP.");
    }
  };
  return { source, error, importFile };
}

/**
 * The kit of the photo it was ordered for; a new photo returns to editing (05-state). The mosaic is
 * recomputed from the current inputs, never taken from the debounced preview (spec kit.md).
 * `preparing` is true from the click until the kit is set, so the editor freezes its inputs.
 */
function useKit(source: RgbaImage | undefined) {
  const [kit, setKit] = useState<{ readonly source: RgbaImage; readonly mosaic: Mosaic }>();
  const [preparing, setPreparing] = useState(false);
  const orderButton = useRef<HTMLButtonElement>(null);
  const order = (current: RgbaImage, size: MosaicSize, dithering: boolean) => {
    setPreparing(true);
    // Let the browser paint «Préparation du kit…» before the blocking computation (spec kit.md).
    requestAnimationFrame(() => setTimeout(() => {
      // finally: a failed computation must never leave the editor frozen.
      try {
        setKit({ source: current, mosaic: computeMosaic(current, size, { dithering }) });
      } finally {
        setPreparing(false);
      }
    }, 0));
  };
  const back = () => {
    setKit(undefined);
    // The button is hidden until the re-render; focus it once it is shown again (WCAG 2.4.3).
    setTimeout(() => orderButton.current?.focus(), 0);
  };
  const shown = kit !== undefined && kit.source === source ? kit.mosaic : undefined;
  return { kit: shown, preparing, order, back, orderButton };
}

/** Import, size, live preview («Aperçu») and the «Commander mon kit» screen. */
export function Editor() {
  const { source, error, importFile } = useImport();
  const [size, setSize] = useState<MosaicSize>(DEFAULT_SIZE);
  const [dithering, setDithering] = useState(false);
  const { kit, preparing, order, back, orderButton } = useKit(source);
  const [over, setOver] = useState(false);
  const canvas = usePreview(source, size, dithering);
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    void importFile(event.dataTransfer.files[0]);
  };
  const setPlates = (side: keyof MosaicSize) => (event: ChangeEvent<HTMLInputElement>) =>
    setSize((current) => ({ ...current, [side]: clampPlates(event.target.value) }));

  return (
    <>
      <label className="dropzone" inert={preparing} data-over={over} onDragOver={(event) => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
        <span>Choisissez une photo ou déposez-la ici</span>
        <input type="file" accept="image/*" className="visually-hidden" onChange={(event) => void importFile(event.target.files?.[0])} />
      </label>
      {error !== undefined && <p role="alert" className="error">{error}</p>}
      {/* Hidden, not unmounted, while the kit shows: the preview canvas keeps its drawing. Inert while
          the kit is prepared, so the kit matches the inputs on screen (spec kit.md). */}
      <div className="controls" hidden={kit !== undefined} inert={preparing}>
        <label>Largeur (plaques)<input type="number" min={1} max={MAX_PLATES} value={size.platesWide} onChange={setPlates("platesWide")} /></label>
        <label>Hauteur (plaques)<input type="number" min={1} max={MAX_PLATES} value={size.platesHigh} onChange={setPlates("platesHigh")} /></label>
        <label><input type="checkbox" checked={dithering} onChange={(event) => setDithering(event.target.checked)} />Tramage</label>
      </div>
      {source !== undefined && (
        <figure className="preview-figure" aria-labelledby="preview-caption" hidden={kit !== undefined}>
          <figcaption id="preview-caption">Aperçu</figcaption>
          <canvas ref={canvas} className="preview">Aperçu de la mosaïque en tuiles rondes.</canvas>
          <button ref={orderButton} type="button" className="order" disabled={preparing} onClick={() => order(source, size, dithering)}>Commander mon kit</button>
          <output className="status">{preparing ? "Préparation du kit…" : ""}</output>
        </figure>
      )}
      {kit !== undefined && <Kit mosaic={kit} onBack={back} />}
    </>
  );
}
