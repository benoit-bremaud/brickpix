import { studsOf, type Mosaic } from "../../domain/mosaic";

/** Pixels per stud on the preview canvas (CSS scales it to the available width). */
export const STUD_PIXELS = 8;

/** Draws each stud as a disc of its palette colour; the canvas background is the base plate. */
export function renderMosaic(canvas: HTMLCanvasElement, mosaic: Mosaic): void {
  const studs = studsOf(mosaic.size);
  canvas.width = studs.width * STUD_PIXELS;
  canvas.height = studs.height * STUD_PIXELS;
  const context = canvas.getContext("2d");
  if (context === null) return;
  const radius = STUD_PIXELS * 0.45;
  const fills = mosaic.palette.colours.map(({ rgb }) => `rgb(${rgb.join(" ")})`);
  mosaic.cells.forEach((cell, i) => {
    const x = i % studs.width;
    const y = Math.floor(i / studs.width);
    context.fillStyle = fills[cell] ?? "transparent";
    context.beginPath();
    context.arc((x + 0.5) * STUD_PIXELS, (y + 0.5) * STUD_PIXELS, radius, 0, 2 * Math.PI);
    context.fill();
  });
}
