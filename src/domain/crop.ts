import { MAX_PLATES, type MosaicSize, type Rect, type RgbaImage } from './mosaic';

/** Largest zoom factor of the frame; 1 is the cover fit (spec retouch.md). */
export const MAX_ZOOM = 8;

/** Number of clockwise quarter turns. */
export type QuarterTurns = 0 | 1 | 2 | 3;

/** How the user frames the photo: zoom 1..MAX_ZOOM, centre in 0..1 of the oriented image. */
export interface Framing {
  readonly zoom: number;
  readonly centreX: number;
  readonly centreY: number;
  readonly quarterTurns: QuarterTurns;
  readonly mirrored: boolean;
}

/** Cover fit, centred, upright: gives the default crop of spec quantise-mosaic.md. */
export const NEUTRAL_FRAMING: Framing = Object.freeze({ zoom: 1, centreX: 0.5, centreY: 0.5, quarterTurns: 0, mirrored: false });

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** Rotates `image` by quarterTurns × 90° clockwise, then mirrors it horizontally if asked. */
export function orient(image: RgbaImage, quarterTurns: QuarterTurns, mirrored: boolean): RgbaImage {
  if (quarterTurns === 0 && !mirrored) return image;
  const sideways = quarterTurns % 2 === 1;
  const width = sideways ? image.height : image.width;
  const height = sideways ? image.width : image.height;
  const data = new Uint8ClampedArray(image.data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ux = mirrored ? width - 1 - x : x; // position before the mirror
      // Source pixel of the rotated position (ux, y).
      const [sx, sy] = [
        [ux, y],
        [y, image.height - 1 - ux],
        [image.width - 1 - ux, image.height - 1 - y],
        [image.width - 1 - y, ux],
      ][quarterTurns] as [number, number];
      const from = (sy * image.width + sx) * 4;
      data.set(image.data.subarray(from, from + 4), (y * width + x) * 4);
    }
  }
  return { width, height, data };
}

/**
 * The crop of a width × height image for `framing`: the cover-fit rectangle of ratio
 * platesWide:platesHigh divided by the zoom, centred on the framing centre, kept inside the image.
 * Integer bounds, at least 1 × 1.
 */
export function cropFor(width: number, height: number, size: MosaicSize, framing: Framing): Rect {
  const ratio = size.platesWide / size.platesHigh;
  const zoom = clamp(framing.zoom, 1, MAX_ZOOM);
  const coverWidth = Math.min(width, height * ratio);
  const cropWidth = Math.max(1, Math.min(width, Math.round(coverWidth / zoom)));
  const cropHeight = Math.max(1, Math.min(height, Math.round(cropWidth / ratio)));
  const x = Math.floor(clamp(framing.centreX, 0, 1) * width - cropWidth / 2);
  const y = Math.floor(clamp(framing.centreY, 0, 1) * height - cropHeight / 2);
  return {
    x: clamp(x, 0, width - cropWidth),
    y: clamp(y, 0, height - cropHeight),
    width: cropWidth,
    height: cropHeight,
  };
}

/** Plates on one axis after the frame side went from oldLength to newLength, in 1..MAX_PLATES. */
export function stretchPlates(plates: number, newLength: number, oldLength: number): number {
  if (!(oldLength > 0) || !Number.isFinite(newLength)) return plates;
  return clamp(Math.round((plates * newLength) / oldLength), 1, MAX_PLATES);
}
