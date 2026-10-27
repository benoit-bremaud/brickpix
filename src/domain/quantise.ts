import { ciede2000, toLab, type Lab } from './colour';
import { assertMosaicSize, studsOf, type Mosaic, type MosaicSize, type RgbaImage } from './image';
import type { Palette, Rgb } from './palette';

/** Floyd–Steinberg weights for the neighbours ahead (dx is mirrored on right-to-left rows). */
const DIFFUSION = [
  { dx: 1, dy: 0, weight: 7 / 16 },
  { dx: -1, dy: 1, weight: 3 / 16 },
  { dx: 0, dy: 1, weight: 5 / 16 },
  { dx: 1, dy: 1, weight: 1 / 16 },
] as const;

interface Candidate {
  readonly index: number;
  readonly rgb: Rgb;
  readonly lab: Lab;
}

/** Palette colour nearest to `lab` by CIEDE2000; ties go to the lower index. */
function nearest(lab: Lab, candidates: readonly Candidate[]): Candidate {
  return candidates.reduce((best, candidate) =>
    ciede2000(lab, candidate.lab) < ciede2000(lab, best.lab) ? candidate : best,
  );
}

/** Working buffer of RGB floats, so diffused error is not rounded away. */
function rgbBuffer(image: RgbaImage): Float32Array {
  const rgb = new Float32Array(image.width * image.height * 3);
  for (let p = 0; p < image.width * image.height; p++) {
    rgb.set(image.data.subarray(p * 4, p * 4 + 3), p * 3);
  }
  return rgb;
}

/** Spreads the quantisation error of pixel (x, y) to its unvisited neighbours. */
function diffuse(rgb: Float32Array, image: RgbaImage, at: { x: number; y: number; dir: number }, error: readonly number[]): void {
  for (const { dx, dy, weight } of DIFFUSION) {
    const nx = at.x + dx * at.dir;
    const ny = at.y + dy;
    if (nx < 0 || nx >= image.width || ny >= image.height) continue;
    const n = (ny * image.width + nx) * 3;
    error.forEach((channelError, c) => {
      rgb[n + c] = Math.min(255, Math.max(0, (rgb[n + c] ?? 0) + channelError * weight));
    });
  }
}

interface Work {
  readonly image: RgbaImage;
  readonly rgb: Float32Array;
  readonly cells: Uint8Array;
  readonly candidates: readonly Candidate[];
  readonly dithering: boolean;
}

/** Quantises row y, right to left on odd rows when dithering (serpentine). */
function quantiseRow(work: Work, y: number): void {
  const { width } = work.image;
  const dir = work.dithering && y % 2 === 1 ? -1 : 1;
  for (let step = 0; step < width; step++) {
    const x = dir === 1 ? step : width - 1 - step;
    const p = y * width + x;
    const [r = 0, g = 0, b = 0] = work.rgb.subarray(p * 3, p * 3 + 3);
    const chosen = nearest(toLab(r, g, b), work.candidates);
    work.cells[p] = chosen.index;
    if (work.dithering) {
      diffuse(work.rgb, work.image, { x, y, dir }, [r - chosen.rgb[0], g - chosen.rgb[1], b - chosen.rgb[2]]);
    }
  }
}

/**
 * Maps each stud of `studs` (16 × plates per side) to its nearest palette colour by CIEDE2000,
 * optionally with Floyd–Steinberg dithering (serpentine scan, error in sRGB 0–255).
 */
export function quantise(studs: RgbaImage, size: MosaicSize, palette: Palette, dithering: boolean): Mosaic {
  assertMosaicSize(size);
  const grid = studsOf(size);
  if (studs.width !== grid.width || studs.height !== grid.height) {
    throw new RangeError(`Expected a ${grid.width} × ${grid.height} stud image, got ${studs.width} × ${studs.height}.`);
  }
  const work: Work = {
    image: studs,
    rgb: rgbBuffer(studs),
    cells: new Uint8Array(grid.width * grid.height),
    candidates: palette.colours.map(({ rgb }, index) => ({ index, rgb, lab: toLab(...rgb) })),
    dithering,
  };
  for (let y = 0; y < grid.height; y++) quantiseRow(work, y);
  return { size, palette, cells: work.cells };
}
