import { describe, expect, it } from 'vitest';

import { flattenBackground } from './background';
import type { RgbaImage } from './mosaic';
import { AUTO_SATURATION, autoTone, MOODS, NEUTRAL_RETOUCH, retouch, type RetouchSettings } from './retouch';

type Rgb = readonly [number, number, number];

function image(width: number, height: number, colourAt: (x: number, y: number) => Rgb): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set([...colourAt(x, y), 255], (y * width + x) * 4);
  return { width, height, data };
}

function pixel(img: RgbaImage, x: number, y: number): number[] {
  const i = (y * img.width + x) * 4;
  return Array.from(img.data.subarray(i, i + 3));
}

const settings = (change: Partial<RetouchSettings>): RetouchSettings => ({ ...NEUTRAL_RETOUCH, ...change });
const one = (rgb: Rgb) => image(1, 1, () => rgb);

describe('retouch tone', () => {
  it('is the identity with neutral settings', () => {
    const studs = image(4, 3, (x, y) => [x * 60, y * 90, 17]);
    expect(retouch(studs, NEUTRAL_RETOUCH).data).toEqual(studs.data);
  });

  it('adds 1.28 × brightness, clamped', () => {
    expect(pixel(retouch(one([100, 0, 250]), settings({ brightness: 50 })), 0, 0)).toEqual([164, 64, 255]);
    expect(pixel(retouch(one([100, 0, 250]), settings({ brightness: -100 })), 0, 0)).toEqual([0, 0, 122]);
  });

  it('scales the distance to 128 by 1 + contrast / 100', () => {
    expect(pixel(retouch(one([28, 128, 178]), settings({ contrast: 50 })), 0, 0)).toEqual([0, 128, 203]);
    expect(pixel(retouch(one([28, 128, 228]), settings({ contrast: -100 })), 0, 0)).toEqual([128, 128, 128]);
  });

  it('moves each channel away from the Rec. 709 luma by 1 + saturation / 100', () => {
    expect(pixel(retouch(one([200, 100, 50]), settings({ saturation: -100 })), 0, 0)).toEqual([118, 118, 118]);
    expect(pixel(retouch(one([90, 90, 90]), settings({ saturation: 100 })), 0, 0)).toEqual([90, 90, 90]);
  });
});

describe('retouch sharpen', () => {
  const edge = image(4, 1, (x) => (x < 2 ? [100, 100, 100] : [200, 200, 200]));

  it('leaves a flat image unchanged', () => {
    const flat = image(3, 3, () => [80, 80, 80]);
    expect(retouch(flat, settings({ sharpen: 100 })).data).toEqual(flat.data);
  });

  it('pushes both sides of an edge apart, more with a higher amount', () => {
    const half = retouch(edge, settings({ sharpen: 50 }));
    const full = retouch(edge, settings({ sharpen: 100 }));
    expect(pixel(half, 1, 0)[0]).toBe(75);
    expect(pixel(full, 1, 0)[0]).toBe(50);
    expect(pixel(full, 2, 0)[0]).toBe(250);
    expect(pixel(full, 0, 0)[0]).toBe(100);
  });
});

describe('tone clamping', () => {
  it('clamps brightness before contrast applies', () => {
    const photo = image(1, 1, () => [250, 250, 250]);
    // 250 + 128 clamps to 255, then (255 − 128) × 0.5 + 128 = 191.5.
    expect(pixel(retouch(photo, settings({ brightness: 100, contrast: -50 })), 0, 0)).toEqual([192, 192, 192]);
  });
});

describe('flattenBackground', () => {
  const sky: Rgb = [90, 150, 220];
  const shirt: Rgb = [200, 40, 40];

  it('flattens a noisy plain background and keeps a subject resting on the bottom border', () => {
    // 12 × 10: noisy sky everywhere, a red subject in the bottom middle touching the bottom edge.
    const photo = image(12, 10, (x, y) => (x >= 4 && x < 8 && y >= 4 ? shirt : [sky[0] + ((x + y) % 3) * 2, sky[1], sky[2]]));
    const out = flattenBackground(photo, 10);
    const background = pixel(out, 0, 0);
    expect(pixel(out, 11, 0)).toEqual(background);
    expect(pixel(out, 5, 2)).toEqual(background);
    expect(pixel(out, 5, 9)).toEqual([...shirt]);
  });

  it('leaves a small border region below the 10 % share untouched', () => {
    const photo = image(12, 10, (x, y) => (x === 0 && y === 0 ? [250, 250, 0] : sky));
    expect(pixel(flattenBackground(photo, 10), 0, 0)).toEqual([250, 250, 0]);
  });

  it('stops a gradient from leaking into the subject (compared to the region mean)', () => {
    // Left to right ramp, each step below the tolerance, the far end well outside it.
    const ramp = image(30, 6, (x) => [20 + x * 7, 20 + x * 7, 20 + x * 7]);
    const out = flattenBackground(ramp, 10);
    expect(pixel(out, 0, 0)).toEqual(pixel(out, 1, 0)); // the dark end is flattened
    expect(pixel(out, 0, 0)).not.toEqual(pixel(out, 29, 0));
  });

  it('never seeds the bottom corners', () => {
    // 2 × 4: a two-shade red bottom row. Seeded by its corners, it would be flattened to one shade.
    const photo = image(2, 4, (x, y) => (y === 3 ? [shirt[0] + x * 2, shirt[1], shirt[2]] : sky));
    expect(pixel(flattenBackground(photo, 10), 0, 3)).toEqual([...shirt]);
  });

  it.each([[1, 6], [6, 1]])('flattens a %i × %i strip without leaving the image', (width, height) => {
    const strip = image(width, height, (x, y) => [sky[0] + ((x + y) % 2) * 2, sky[1], sky[2]]);
    const out = flattenBackground(strip, 10);
    expect(pixel(out, width - 1, height - 1)).toEqual(pixel(out, 0, 0));
  });

  it('is deterministic and runs through retouch only when enabled', () => {
    const photo = image(8, 8, (x, y) => [(x * 13) % 255, (y * 29) % 255, 90]);
    expect(flattenBackground(photo, 12).data).toEqual(flattenBackground(photo, 12).data);
    expect(retouch(photo, settings({ background: { enabled: false, tolerance: 20 } })).data).toEqual(photo.data);
    expect(retouch(photo, settings({ background: { enabled: true, tolerance: 20 } })).data).toEqual(flattenBackground(photo, 20).data);
  });
});

describe('autoTone', () => {
  const lumaRamp = (low: number, high: number) => image(100, 1, (x) => {
    const v = low + ((high - low) * x) / 99;
    return [v, v, v];
  });

  it('stretches a dull photo', () => {
    expect(autoTone(lumaRamp(40, 200))).toEqual({ brightness: 5, contrast: 61, saturation: AUTO_SATURATION });
  });

  it('is nearly neutral on a well exposed photo', () => {
    const tone = autoTone(lumaRamp(0, 255));
    expect(tone.contrast).toBeLessThanOrEqual(3);
    expect(Math.abs(tone.brightness)).toBeLessThanOrEqual(1);
  });

  it('caps the contrast at 100 on a dark photo, with bounded brightness', () => {
    const tone = autoTone(lumaRamp(5, 120));
    expect(tone.contrast).toBe(100);
    expect(tone.brightness).toBeGreaterThan(0);
    expect(tone.brightness).toBeLessThanOrEqual(100);
  });

  it('copes with a uniform image', () => {
    const tone = autoTone(image(5, 5, () => [128, 128, 128]));
    expect(tone).toEqual({ brightness: 0, contrast: 100, saturation: AUTO_SATURATION });
  });
});

describe('MOODS', () => {
  it('starts with Naturel, the tone reset', () => {
    expect(MOODS[0]).toEqual({ name: 'Naturel', tone: { brightness: 0, contrast: 0, saturation: 0 } });
    expect(MOODS.map((mood) => mood.name)).toEqual(['Naturel', 'Pop', 'Doux', 'N&B']);
  });
});
