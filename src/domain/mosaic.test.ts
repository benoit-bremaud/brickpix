import { describe, expect, it } from 'vitest';

import { ciede2000, toLab, type Lab } from './colour';
import { cropFor, NEUTRAL_FRAMING } from './crop';
import { assertMosaicSize, DEFAULT_SIZE, MAX_PLATES, studsOf, type RgbaImage } from './mosaic';
import { ROUND_TILE_PALETTE } from './palette';
import { quantise } from './quantise';
import { resample } from './resample';

function solid(width: number, height: number, rgba: readonly number[]): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) data.set(rgba, p * 4);
  return { width, height, data };
}

describe('assertMosaicSize', () => {
  it('accepts 1..MAX_PLATES and the default 3 × 3', () => {
    expect(() => assertMosaicSize(DEFAULT_SIZE)).not.toThrow();
    expect(() => assertMosaicSize({ platesWide: 1, platesHigh: MAX_PLATES })).not.toThrow();
  });

  it.each([0, MAX_PLATES + 1, 2.5, Number.NaN])('rejects %s', (plates) => {
    expect(() => assertMosaicSize({ platesWide: plates, platesHigh: 3 })).toThrow(RangeError);
    expect(() => assertMosaicSize({ platesWide: 3, platesHigh: plates })).toThrow(RangeError);
  });

  it('counts 16 studs per plate', () => {
    expect(studsOf({ platesWide: 4, platesHigh: 2 })).toEqual({ width: 64, height: 32 });
  });
});

describe('cropFor with the neutral framing (former default crop)', () => {
  it('centres a square in a landscape photo', () => {
    expect(cropFor(400, 300, DEFAULT_SIZE, NEUTRAL_FRAMING)).toEqual({ x: 50, y: 0, width: 300, height: 300 });
  });

  it('centres a wide crop in a portrait photo', () => {
    expect(cropFor(300, 400, { platesWide: 2, platesHigh: 1 }, NEUTRAL_FRAMING)).toEqual({ x: 0, y: 125, width: 300, height: 150 });
  });

  it('never goes below 1 × 1', () => {
    expect(cropFor(1, 1, { platesWide: 8, platesHigh: 1 }, NEUTRAL_FRAMING)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});

describe('resample', () => {
  it('averages the area under each stud', () => {
    const image = solid(32, 16, [0, 0, 0, 255]);
    for (let p = 0; p < 32 * 16; p += 2) image.data.set([200, 100, 50, 255], p * 4);
    const out = resample(image, { x: 0, y: 0, width: 32, height: 16 }, { platesWide: 1, platesHigh: 1 });
    expect(out.width).toBe(16);
    expect([...out.data.subarray(0, 4)]).toEqual([100, 50, 25, 255]);
  });

  it('weights partial pixels on fractional footprints', () => {
    const image = solid(24, 16, [0, 0, 0, 255]);
    for (let y = 0; y < 16; y++) image.data.set([255, 255, 255, 255], (y * 24 + 1) * 4);
    const out = resample(image, { x: 0, y: 0, width: 24, height: 16 }, { platesWide: 1, platesHigh: 1 });
    // Stud 0 covers pixels [0, 1.5): half of the white pixel 1 over a footprint of 1.5.
    expect(out.data[0]).toBe(85);
  });

  it('composites transparency over white', () => {
    const out = resample(solid(16, 16, [0, 0, 0, 0]), { x: 0, y: 0, width: 16, height: 16 }, { platesWide: 1, platesHigh: 1 });
    expect([...out.data.subarray(0, 4)]).toEqual([255, 255, 255, 255]);
  });

  it('takes the nearest pixel when upscaling, inside the crop', () => {
    const image = solid(4, 4, [0, 0, 0, 255]);
    image.data.set([255, 0, 0, 255], (1 * 4 + 1) * 4);
    const out = resample(image, { x: 1, y: 1, width: 2, height: 2 }, { platesWide: 1, platesHigh: 1 });
    expect([...out.data.subarray(0, 4)]).toEqual([255, 0, 0, 255]);
    expect([...out.data.subarray((15 * 16 + 15) * 4, (15 * 16 + 15) * 4 + 4)]).toEqual([0, 0, 0, 255]);
  });
});

describe('colour', () => {
  it('converts sRGB white and black to Lab', () => {
    const white = toLab(255, 255, 255);
    expect(white[0]).toBeCloseTo(100, 3);
    expect(white[1]).toBeCloseTo(0, 2);
    expect(white[2]).toBeCloseTo(0, 2);
    expect(toLab(0, 0, 0)[0]).toBeCloseTo(0, 6);
  });

  // Reference pairs from Sharma, Wu and Dalal (2005), table 1.
  const pairs: [Lab, Lab, number][] = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0],
    [[50, 0, 0], [50, -1, 2], 2.3669],
    [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
    [[50, 2.49, -0.001], [50, -2.49, 0.0011], 7.2195],
    [[50, -0.001, 2.49], [50, 0.0009, -2.49], 4.8045],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
    [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
    [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
  ];

  it.each(pairs)('matches Sharma reference %#', (first, second, expected) => {
    expect(ciede2000(first, second)).toBeCloseTo(expected, 4);
    expect(ciede2000(second, first)).toBeCloseTo(expected, 4);
  });
});

describe('quantise', () => {
  const size = { platesWide: 1, platesHigh: 1 };

  it.each([false, true])('maps a palette colour to its own index everywhere (dithering %s)', (dithering) => {
    ROUND_TILE_PALETTE.colours.forEach((colour, index) => {
      const mosaic = quantise(solid(16, 16, [...colour.rgb, 255]), size, ROUND_TILE_PALETTE, { dithering });
      expect(mosaic.cells.every((cell) => cell === index)).toBe(true);
    });
  });

  it('returns one valid index per stud', () => {
    const studs = studsOf({ platesWide: 2, platesHigh: 1 });
    const image = solid(studs.width, studs.height, [0, 0, 0, 255]);
    for (let p = 0; p < studs.width * studs.height; p++) image.data.set([(p * 37) % 256, (p * 91) % 256, (p * 13) % 256], p * 4);
    const mosaic = quantise(image, { platesWide: 2, platesHigh: 1 }, ROUND_TILE_PALETTE, { dithering: true });
    expect(mosaic.cells).toHaveLength(512);
    expect(mosaic.cells.every((cell) => cell < ROUND_TILE_PALETTE.colours.length)).toBe(true);
    expect(quantise(image, { platesWide: 2, platesHigh: 1 }, ROUND_TILE_PALETTE, { dithering: true }).cells).toEqual(mosaic.cells);
  });

  it('dithers a mid grey into a mix of colours, flat without dithering', () => {
    const grey = solid(16, 16, [130, 130, 130, 255]);
    const flat = new Set(quantise(grey, size, ROUND_TILE_PALETTE, { dithering: false }).cells);
    const dithered = new Set(quantise(grey, size, ROUND_TILE_PALETTE, { dithering: true }).cells);
    expect(flat.size).toBe(1);
    expect(dithered.size).toBeGreaterThan(1);
  });

});

describe('quantise with dithering', () => {
  const size = { platesWide: 1, platesHigh: 1 };

  it('keeps the mean tone when dithering (error diffusion conserves it)', () => {
    const blackWhite = { colours: ROUND_TILE_PALETTE.colours.filter(({ id }) => id === 'black' || id === 'white') };
    const dark = solid(16, 16, [64, 64, 64, 255]);
    const cells = quantise(dark, size, blackWhite, { dithering: true }).cells;
    const whiteShare = cells.filter((cell) => cell === 0).length / cells.length;
    // Black is #05131D, not #000: the expected share of white is about (64 - 15) / (255 - 15).
    expect(whiteShare).toBeGreaterThan(0.15);
    expect(whiteShare).toBeLessThan(0.3);
    expect(new Set(quantise(dark, size, blackWhite, { dithering: false }).cells)).toEqual(new Set([1]));
  });

  it('rejects an empty palette', () => {
    expect(() => quantise(solid(16, 16, [0, 0, 0, 255]), size, { colours: [] }, { dithering: false })).toThrow(RangeError);
  });

  it('breaks ties toward the lower index', () => {
    const white = ROUND_TILE_PALETTE.colours.filter(({ id }) => id === 'white');
    const twins = { colours: [...white, ...white] };
    expect(quantise(solid(16, 16, [255, 255, 255, 255]), size, twins, { dithering: false }).cells[0]).toBe(0);
  });

  it('rejects an image that does not match the stud grid', () => {
    expect(() => quantise(solid(8, 8, [0, 0, 0, 255]), size, ROUND_TILE_PALETTE, { dithering: false })).toThrow(RangeError);
  });
});
