import { useEffect, useRef } from "react";

import { cropFor } from "../domain/crop";
import type { MosaicSize, RgbaImage } from "../domain/mosaic";
import type { RetouchSettings } from "../domain/retouch";
import { renderMosaic } from "./canvas/renderMosaic";
import { renderPhoto } from "./canvas/renderPhoto";
import { computeMosaic } from "./chain";

/** Delay between the last size, retouch or dithering change and the mosaic preview refresh. */
export const PREVIEW_DEBOUNCE_MS = 150;

/** What the canvas shows: the photo with its frame («Cadrer»), the photo before retouch, or the mosaic. */
export type View = "frame" | "before" | "mosaic";

/** The current photo, size, retouch and view the preview draws. */
export interface PreviewInputs {
  readonly oriented: RgbaImage;
  readonly size: MosaicSize;
  readonly settings: RetouchSettings;
  readonly dithering: boolean;
  readonly view: View;
}

/**
 * Draws the preview: the photo at once, the mosaic debounced except for a new photo or view.
 * Draws nothing while `paused` (the kit is computed or shown). Returns the ref for the canvas.
 */
export function usePreview({ oriented, size, settings, dithering, view }: PreviewInputs, paused: boolean) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef<{ oriented: RgbaImage; view: View } | undefined>(undefined);
  useEffect(() => {
    // paused: the kit computes its own mosaic; a pending preview would repeat that work (Codex P2).
    if (paused) return;
    const draw = () => {
      shown.current = { oriented, view };
      const target = canvas.current;
      if (target === null) return;
      if (view === "mosaic") renderMosaic(target, computeMosaic(oriented, size, settings, { dithering }));
      else renderPhoto(target, oriented, cropFor(oriented.width, oriented.height, size, settings.framing), view);
    };
    if (view !== "mosaic" || shown.current?.oriented !== oriented || shown.current.view !== view) {
      draw();
      return;
    }
    const timer = setTimeout(draw, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [oriented, size, settings, dithering, view, paused]);
  return canvas;
}
