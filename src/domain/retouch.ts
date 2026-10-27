import { BACKGROUND_TOLERANCE, flattenBackground, type Background } from './background';
import { NEUTRAL_FRAMING, type Framing } from './crop';
import type { RgbaImage } from './mosaic';

/** Tone values: brightness, contrast and saturation in -100..100. */
export interface Tone {
  readonly brightness: number;
  readonly contrast: number;
  readonly saturation: number;
}

/** Every retouch setting of spec retouch.md. Sharpen is in 0..100. */
export interface RetouchSettings extends Tone {
  readonly framing: Framing;
  readonly sharpen: number;
  readonly background: Background;
}

export const NEUTRAL_RETOUCH: RetouchSettings = Object.freeze({
  framing: NEUTRAL_FRAMING,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
  background: Object.freeze({ enabled: false, tolerance: BACKGROUND_TOLERANCE.default }),
});

/** Saturation that Auto sets, to offset the greying of the stud average. */
export const AUTO_SATURATION = 15;

/** Moods fill the tone sliders; Naturel is the tone reset. */
export const MOODS: readonly { readonly name: string; readonly tone: Tone }[] = Object.freeze([
  { name: 'Naturel', tone: { brightness: 0, contrast: 0, saturation: 0 } },
  { name: 'Pop', tone: { brightness: 0, contrast: 20, saturation: 40 } },
  { name: 'Doux', tone: { brightness: 0, contrast: -20, saturation: -20 } },
  { name: 'N&B', tone: { brightness: 0, contrast: 0, saturation: -100 } },
]);

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Brightness, contrast then saturation, each clamped to 0–255 (spec retouch.md § Tone). */
function applyTone(image: RgbaImage, tone: Tone): RgbaImage {
  const data = new Uint8ClampedArray(image.data);
  const offset = 1.28 * tone.brightness;
  const gain = 1 + tone.contrast / 100;
  const chroma = 1 + tone.saturation / 100;
  for (let i = 0; i < data.length; i += 4) {
    const rgb = [0, 1, 2].map((c) => clamp(((image.data[i + c] ?? 0) + offset - 128) * gain + 128, 0, 255));
    const [r = 0, g = 0, b = 0] = rgb;
    const y = luma(r, g, b);
    for (let c = 0; c < 3; c++) data[i + c] = y + ((rgb[c] ?? 0) - y) * chroma;
  }
  return { width: image.width, height: image.height, data };
}

/** Unsharp mask with the separable 3 × 3 Gaussian (1-2-1)/4, edges replicated. */
function sharpen(image: RgbaImage, amount: number): RgbaImage {
  const { width, height } = image;
  const at = (x: number, y: number, c: number) =>
    image.data[(clamp(y, 0, height - 1) * width + clamp(x, 0, width - 1)) * 4 + c] ?? 0;
  const blur = (x: number, y: number, c: number) => {
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) sum += at(x + dx, y + dy, c) * (2 - Math.abs(dx)) * (2 - Math.abs(dy));
    }
    return sum / 16;
  };
  const gain = 2 * (amount / 100);
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    for (let c = 0; c < 3; c++) data[i * 4 + c] = at(x, y, c) + gain * (at(x, y, c) - blur(x, y, c));
  }
  return { width, height, data };
}

/** Tone, sharpen, then background on the stud image; the framing is applied before resampling. */
export function retouch(studs: RgbaImage, settings: RetouchSettings): RgbaImage {
  const neutralTone = settings.brightness === 0 && settings.contrast === 0 && settings.saturation === 0;
  const toned = neutralTone ? studs : applyTone(studs, settings);
  const sharp = settings.sharpen > 0 ? sharpen(toned, settings.sharpen) : toned;
  return settings.background.enabled ? flattenBackground(sharp, settings.background.tolerance) : sharp;
}

/** Value at `share` of the sorted values (nearest rank). */
function percentile(sorted: Float64Array, share: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))] ?? 0;
}

/**
 * Auto (spec retouch.md): stretches the luma percentiles 1 %–99 % of the untoned studs to 0–255
 * (contrast capped at 100), expressed as brightness and contrast, with saturation AUTO_SATURATION.
 */
export function autoTone(studs: RgbaImage): Tone {
  const lumas = new Float64Array(studs.width * studs.height);
  for (let i = 0; i < lumas.length; i++) {
    lumas[i] = luma(studs.data[i * 4] ?? 0, studs.data[i * 4 + 1] ?? 0, studs.data[i * 4 + 2] ?? 0);
  }
  lumas.sort();
  const low = percentile(lumas, 0.01);
  const high = percentile(lumas, 0.99);
  const factor = clamp(255 / Math.max(1, high - low), 0, 2);
  // Midpoint to 128: maps low..high to 0..255 when the factor is not capped, keeps flat photos sane.
  const brightness = clamp(Math.round((128 - (low + high) / 2) / 1.28), -100, 100);
  return { brightness, contrast: Math.round(100 * (factor - 1)), saturation: AUTO_SATURATION };
}
