import { describe, expect, it } from 'vitest';

import { cropFor, MAX_ZOOM, NEUTRAL_FRAMING, orient, stretchPlates, type Framing } from './crop';
import { MAX_PLATES, type RgbaImage } from './mosaic';

/** A width × height image whose red channel is the pixel index, so every pixel is traceable. */
function indexed(width: number, height: number): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([i, 0, 0, 255], i * 4);
  return { width, height, data };
}

function reds(image: RgbaImage): number[] {
  return Array.from({ length: image.width * image.height }, (_, i) => image.data[i * 4] ?? -1);
}

describe('orient', () => {
  // 3 × 2 image:  0 1 2
  //               3 4 5
  const image = indexed(3, 2);

  it('returns the same image when upright and not mirrored', () => {
    expect(orient(image, 0, false)).toBe(image);
  });

  it('rotates clockwise by quarter turns', () => {
    expect(orient(image, 1, false)).toMatchObject({ width: 2, height: 3 });
    expect(reds(orient(image, 1, false))).toEqual([3, 0, 4, 1, 5, 2]);
    expect(reds(orient(image, 2, false))).toEqual([5, 4, 3, 2, 1, 0]);
    expect(reds(orient(image, 3, false))).toEqual([2, 5, 1, 4, 0, 3]);
  });

  it('mirrors horizontally after the rotation', () => {
    expect(reds(orient(image, 0, true))).toEqual([2, 1, 0, 5, 4, 3]);
    expect(reds(orient(image, 1, true))).toEqual([0, 3, 1, 4, 2, 5]);
  });

  it('returns to the original after four quarter turns and after two mirrors', () => {
    const turned = [1, 1, 1].reduce((current) => orient(current, 1, false), orient(image, 1, false));
    expect(reds(turned)).toEqual(reds(image));
    expect(reds(orient(orient(image, 0, true), 0, true))).toEqual(reds(image));
  });
});

describe('cropFor', () => {
  const size = { platesWide: 3, platesHigh: 2 };
  const framing = (change: Partial<Framing>): Framing => ({ ...NEUTRAL_FRAMING, ...change });

  it('divides the cover-fit crop by the zoom, centred', () => {
    expect(cropFor(600, 400, size, framing({ zoom: 2 }))).toEqual({ x: 150, y: 100, width: 300, height: 200 });
  });

  it('follows the centre and keeps the crop inside the image', () => {
    expect(cropFor(600, 400, size, framing({ zoom: 2, centreX: 0, centreY: 1 }))).toEqual({ x: 0, y: 200, width: 300, height: 200 });
    expect(cropFor(600, 400, size, framing({ zoom: 4, centreX: 0.75, centreY: 0.25 }))).toEqual({ x: 375, y: 50, width: 150, height: 100 });
  });

  it('clamps the zoom and the centre to their ranges', () => {
    expect(cropFor(600, 400, size, framing({ zoom: 0.5, centreX: -1 }))).toEqual({ x: 0, y: 0, width: 600, height: 400 });
    expect(cropFor(600, 400, size, framing({ zoom: 100 }))).toEqual(cropFor(600, 400, size, framing({ zoom: MAX_ZOOM })));
  });

  it('keeps the size ratio within one pixel and stays inside the image at every zoom and centre', () => {
    for (const zoom of [1, 1.7, 3, MAX_ZOOM]) {
      for (const centre of [0, 0.33, 1]) {
        const crop = cropFor(1000, 777, size, framing({ zoom, centreX: centre, centreY: 1 - centre }));
        expect(Math.abs(crop.height * 1.5 - crop.width)).toBeLessThanOrEqual(1.5);
        expect(crop.x).toBeGreaterThanOrEqual(0);
        expect(crop.y).toBeGreaterThanOrEqual(0);
        expect(crop.x + crop.width).toBeLessThanOrEqual(1000);
        expect(crop.y + crop.height).toBeLessThanOrEqual(777);
      }
    }
  });
});

describe('stretchPlates', () => {
  it('scales the plates with the frame side, rounded', () => {
    expect(stretchPlates(3, 200, 100)).toBe(6);
    expect(stretchPlates(3, 140, 100)).toBe(4);
  });

  it('clamps to 1..MAX_PLATES', () => {
    expect(stretchPlates(3, 1, 100)).toBe(1);
    expect(stretchPlates(3, 10_000, 100)).toBe(MAX_PLATES);
  });

  it('keeps the plates when a length is not usable', () => {
    expect(stretchPlates(3, 50, 0)).toBe(3);
    expect(stretchPlates(3, Number.NaN, 100)).toBe(3);
  });
});
