import { assertMosaicSize, studsOf, type MosaicSize, type Rect, type RgbaImage } from './mosaic';

/** Pixel of `image` at (x, y), composited over white, as [r, g, b] 0–255. */
function opaquePixel(image: RgbaImage, x: number, y: number): [number, number, number] {
  const i = (y * image.width + x) * 4;
  const [r = 0, g = 0, b = 0, a = 0] = image.data.subarray(i, i + 4);
  const alpha = a / 255;
  const over = (channel: number) => channel * alpha + 255 * (1 - alpha);
  return [over(r), over(g), over(b)];
}

/** Overlap of the pixel [p, p + 1) with the interval [start, end). */
function overlap(p: number, start: number, end: number): number {
  return Math.max(0, Math.min(p + 1, end) - Math.max(p, start));
}

/** Area-weighted average of the source pixels under one stud footprint, in crop coordinates. */
function averageArea(image: RgbaImage, crop: Rect, footprint: Rect): [number, number, number] {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let weight = 0;
  // Float rounding can push the last footprint a hair past the crop; never read outside it.
  const xEnd = Math.min(crop.width, footprint.x + footprint.width);
  const yEnd = Math.min(crop.height, footprint.y + footprint.height);
  for (let y = Math.floor(footprint.y); y < yEnd; y++) {
    const wy = overlap(y, footprint.y, yEnd);
    for (let x = Math.floor(footprint.x); x < xEnd; x++) {
      const w = wy * overlap(x, footprint.x, xEnd);
      const [r, g, b] = opaquePixel(image, crop.x + x, crop.y + y);
      sumR += r * w;
      sumG += g * w;
      sumB += b * w;
      weight += w;
    }
  }
  return [sumR / weight, sumG / weight, sumB / weight];
}

/** Nearest source pixel to the centre of one stud footprint (upscale). */
function nearest(image: RgbaImage, crop: Rect, footprint: Rect): [number, number, number] {
  const x = Math.min(crop.width - 1, Math.floor(footprint.x + footprint.width / 2));
  const y = Math.min(crop.height - 1, Math.floor(footprint.y + footprint.height / 2));
  return opaquePixel(image, crop.x + x, crop.y + y);
}

/**
 * Resamples the crop of `image` to the stud grid of `size` (16 × plates per side): area average
 * when downscaling, nearest pixel when the crop is smaller than the grid. Output alpha is 255.
 */
export function resample(image: RgbaImage, crop: Rect, size: MosaicSize): RgbaImage {
  assertMosaicSize(size);
  const studs = studsOf(size);
  const scaleX = crop.width / studs.width;
  const scaleY = crop.height / studs.height;
  const sample = scaleX >= 1 && scaleY >= 1 ? averageArea : nearest;
  const data = new Uint8ClampedArray(studs.width * studs.height * 4);
  for (let sy = 0; sy < studs.height; sy++) {
    for (let sx = 0; sx < studs.width; sx++) {
      const footprint = { x: sx * scaleX, y: sy * scaleY, width: scaleX, height: scaleY };
      const i = (sy * studs.width + sx) * 4;
      data.set(sample(image, crop, footprint), i);
      data[i + 3] = 255;
    }
  }
  return { width: studs.width, height: studs.height, data };
}
