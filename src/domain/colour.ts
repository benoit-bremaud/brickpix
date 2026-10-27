/** A CIELAB colour (D65 white): lightness 0–100, then the a* and b* axes. */
export type Lab = readonly [lightness: number, a: number, b: number];

const D65 = [0.95047, 1, 1.08883] as const;
const RAD = Math.PI / 180;
const POW25_7 = 25 ** 7;

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function labF(t: number): number {
  return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
}

/** Converts an sRGB colour (channels 0–255, may be fractional) to CIELAB D65. */
export function toLab(red: number, green: number, blue: number): Lab {
  const r = toLinear(red);
  const g = toLinear(green);
  const b = toLinear(blue);
  const fx = labF((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / D65[0]);
  const fy = labF((0.2126729 * r + 0.7151522 * g + 0.072175 * b) / D65[1]);
  const fz = labF((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / D65[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** WCAG relative luminance of an sRGB colour (channels 0–255): 0 for black, 1 for white. */
export function relativeLuminance(red: number, green: number, blue: number): number {
  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

/** Hue angle in degrees, 0–360. */
function hue(a: number, b: number): number {
  const h = Math.atan2(b, a) / RAD;
  return h < 0 ? h + 360 : h;
}

/** Hue difference and mean hue of CIEDE2000 (Sharma et al. 2005, eqs. 10 and 14). */
function hueTerms(h1: number, h2: number, chromaProduct: number): { delta: number; mean: number } {
  if (chromaProduct === 0) return { delta: 0, mean: h1 + h2 };
  const diff = h2 - h1;
  const delta = Math.abs(diff) <= 180 ? diff : diff - Math.sign(diff) * 360;
  const sum = h1 + h2;
  if (Math.abs(diff) <= 180) return { delta, mean: sum / 2 };
  return { delta, mean: sum < 360 ? (sum + 360) / 2 : (sum - 360) / 2 };
}

/** Rotation term R_T and hue weight T at mean chroma and mean hue. */
function rotation(meanChroma: number, meanHue: number): { rt: number; t: number } {
  const t =
    1 -
    0.17 * Math.cos((meanHue - 30) * RAD) +
    0.24 * Math.cos(2 * meanHue * RAD) +
    0.32 * Math.cos((3 * meanHue + 6) * RAD) -
    0.2 * Math.cos((4 * meanHue - 63) * RAD);
  const dTheta = 30 * Math.exp(-(((meanHue - 275) / 25) ** 2));
  const rc = 2 * Math.sqrt(meanChroma ** 7 / (meanChroma ** 7 + POW25_7));
  return { rt: -Math.sin(2 * dTheta * RAD) * rc, t };
}

/** CIEDE2000 colour difference with kL = kC = kH = 1. */
export function ciede2000(first: Lab, second: Lab): number {
  const [l1, a1, b1] = first;
  const [l2, a2, b2] = second;
  const meanC = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - Math.sqrt(meanC ** 7 / (meanC ** 7 + POW25_7)));
  const ap1 = (1 + g) * a1;
  const ap2 = (1 + g) * a2;
  const c1 = Math.hypot(ap1, b1);
  const c2 = Math.hypot(ap2, b2);
  const { delta, mean } = hueTerms(hue(ap1, b1), hue(ap2, b2), c1 * c2);
  const deltaH = 2 * Math.sqrt(c1 * c2) * Math.sin((delta * RAD) / 2);
  const meanL = (l1 + l2) / 2;
  const meanCp = (c1 + c2) / 2;
  const { rt, t } = rotation(meanCp, mean);
  const sl = 1 + (0.015 * (meanL - 50) ** 2) / Math.sqrt(20 + (meanL - 50) ** 2);
  const dl = (l2 - l1) / sl;
  const dc = (c2 - c1) / (1 + 0.045 * meanCp);
  const dh = deltaH / (1 + 0.015 * meanCp * t);
  return Math.sqrt(dl * dl + dc * dc + dh * dh + rt * dc * dh);
}
