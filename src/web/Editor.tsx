import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { defaultCrop } from "../domain/crop";
import { DEFAULT_SIZE, MAX_PLATES, type Mosaic, type MosaicSize, type RgbaImage } from "../domain/image";
import { ROUND_TILE_PALETTE } from "../domain/palette";
import { quantise } from "../domain/quantise";
import { resample } from "../domain/resample";
import { decodeFile } from "./canvas/imageIO";
import { renderMosaic } from "./canvas/renderMosaic";

/** Delay between the last size or dithering change and the preview refresh. */
export const PREVIEW_DEBOUNCE_MS = 150;

/** The photo-to-mosaic chain of spec quantise-mosaic.md. */
export function computeMosaic(source: RgbaImage, size: MosaicSize, dithering: boolean): Mosaic {
  const studs = resample(source, defaultCrop(source.width, source.height, size), size);
  return quantise(studs, size, ROUND_TILE_PALETTE, dithering);
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
      if (canvas.current !== null) renderMosaic(canvas.current, computeMosaic(source, size, dithering));
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

/** Import, size and live preview («Aperçu») of the mosaic editor. */
export function Editor() {
  const [source, setSource] = useState<RgbaImage>();
  const [error, setError] = useState<string>();
  const [size, setSize] = useState<MosaicSize>(DEFAULT_SIZE);
  const [dithering, setDithering] = useState(false);
  const [over, setOver] = useState(false);
  const canvas = usePreview(source, size, dithering);

  const importFile = async (file: File | undefined) => {
    if (file === undefined) return;
    try {
      setSource(await decodeFile(file));
      setError(undefined);
    } catch {
      setError("Impossible de lire cette image. Essayez un fichier JPEG, PNG ou WebP.");
    }
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    void importFile(event.dataTransfer.files[0]);
  };
  const setPlates = (side: keyof MosaicSize) => (event: ChangeEvent<HTMLInputElement>) =>
    setSize((current) => ({ ...current, [side]: clampPlates(event.target.value) }));

  return (
    <>
      <label className="dropzone" data-over={over} onDragOver={(event) => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
        Choisissez une photo ou déposez-la ici
        <input type="file" accept="image/*" hidden onChange={(event) => void importFile(event.target.files?.[0])} />
      </label>
      {error !== undefined && <p role="alert" className="error">{error}</p>}
      <div className="controls">
        <label>Largeur (plaques)<input type="number" min={1} max={MAX_PLATES} value={size.platesWide} onChange={setPlates("platesWide")} /></label>
        <label>Hauteur (plaques)<input type="number" min={1} max={MAX_PLATES} value={size.platesHigh} onChange={setPlates("platesHigh")} /></label>
        <label><input type="checkbox" checked={dithering} onChange={(event) => setDithering(event.target.checked)} />Tramage</label>
      </div>
      {source !== undefined && <canvas ref={canvas} className="preview" aria-label="Aperçu de la mosaïque" role="img" />}
    </>
  );
}
