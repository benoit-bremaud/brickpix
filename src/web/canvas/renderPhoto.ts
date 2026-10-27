import type { Rect, RgbaImage } from "../../domain/mosaic";

/** Longest side of the photo drawn on the preview canvas (CSS scales it to the available width). */
export const PHOTO_SIDE = 1024;

/** «Cadrer» shows the whole photo with the frame; «before» shows the framed photo only. */
export type PhotoView = "frame" | "before";

const uploaded = new WeakMap<RgbaImage, HTMLCanvasElement>();

/** The photo as a canvas, uploaded once per image so panning only redraws. */
function bitmapOf(image: RgbaImage): HTMLCanvasElement | undefined {
  const cached = uploaded.get(image);
  if (cached !== undefined) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (context === null) return undefined;
  const pixels = context.createImageData(image.width, image.height);
  pixels.data.set(image.data);
  context.putImageData(pixels, 0, 0);
  uploaded.set(image, canvas);
  return canvas;
}

function token(canvas: HTMLCanvasElement, name: string): string {
  return getComputedStyle(canvas).getPropertyValue(name).trim();
}

/** Dims outside the frame, outlines it and draws its eight handles, in canvas pixels. */
function drawFrame(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, frame: Rect): void {
  const { width, height } = canvas;
  context.fillStyle = token(canvas, "--colour-frame-dim");
  context.fillRect(0, 0, width, frame.y);
  context.fillRect(0, frame.y + frame.height, width, height - frame.y - frame.height);
  context.fillRect(0, frame.y, frame.x, frame.height);
  context.fillRect(frame.x + frame.width, frame.y, width - frame.x - frame.width, frame.height);
  context.strokeStyle = token(canvas, "--colour-frame-edge");
  context.fillStyle = context.strokeStyle;
  context.lineWidth = Math.max(2, width / 300);
  context.strokeRect(frame.x, frame.y, frame.width, frame.height);
  const knob = Math.max(8, width / 50);
  for (const fx of [0, 0.5, 1]) {
    for (const fy of [0, 0.5, 1]) {
      if (fx === 0.5 && fy === 0.5) continue;
      context.fillRect(frame.x + fx * frame.width - knob / 2, frame.y + fy * frame.height - knob / 2, knob, knob);
    }
  }
}

/** Draws the oriented photo: whole with the frame («Cadrer»), or only the framed part («before»). */
export function renderPhoto(canvas: HTMLCanvasElement, image: RgbaImage, crop: Rect, view: PhotoView): void {
  const shown = view === "frame" ? { x: 0, y: 0, width: image.width, height: image.height } : crop;
  const scale = Math.min(1, PHOTO_SIDE / Math.max(shown.width, shown.height));
  canvas.width = Math.max(1, Math.round(shown.width * scale));
  canvas.height = Math.max(1, Math.round(shown.height * scale));
  const context = canvas.getContext("2d");
  const bitmap = bitmapOf(image);
  if (context === null || bitmap === undefined) return;
  // Transparent pixels show over white, as the mosaic chain composites them (resample.ts).
  context.fillStyle = token(canvas, "--colour-photo-matte");
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, shown.x, shown.y, shown.width, shown.height, 0, 0, canvas.width, canvas.height);
  if (view === "frame") {
    drawFrame(canvas, context, { x: crop.x * scale, y: crop.y * scale, width: crop.width * scale, height: crop.height * scale });
  }
}
