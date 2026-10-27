import { ciede2000, toLab, type Lab } from './colour';
import type { RgbaImage } from './mosaic';

/** Share of the seeded border a region must cover to be flattened (spec retouch.md). */
export const MIN_BORDER_SHARE = 0.1;

/** Background tool settings: tolerance is a CIEDE2000 distance in BACKGROUND_TOLERANCE. */
export interface Background {
  readonly enabled: boolean;
  readonly tolerance: number;
}

export const BACKGROUND_TOLERANCE = Object.freeze({ min: 5, max: 20, default: 10 });

const BLACK: Lab = [0, 0, 0];

/** Indices of the top row, then the left and right columns (the bottom row is never seeded). */
function seeds(width: number, height: number): number[] {
  const list = new Set<number>();
  for (let x = 0; x < width; x++) list.add(x);
  for (let y = 1; y < height; y++) list.add(y * width).add(y * width + width - 1);
  return [...list];
}

function neighbours(i: number, width: number, count: number): number[] {
  const x = i % width;
  return [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width].filter((n) => n >= 0 && n < count);
}

/** What region growing reads and writes: `region` holds each stud's region id, -1 when unvisited. */
interface Grid {
  readonly labs: readonly Lab[];
  readonly width: number;
  readonly tolerance: number;
  readonly region: Int32Array;
}

/** Grows one 4-connected region from `seed`; a neighbour joins when close to the running mean. */
function grow({ labs, width, tolerance, region }: Grid, seed: number, id: number): number[] {
  const members = [seed];
  region[seed] = id;
  let [sumL, sumA, sumB] = labs[seed] ?? BLACK;
  for (let head = 0; head < members.length; head++) {
    for (const n of neighbours(members[head] ?? seed, width, labs.length)) {
      if (region[n] !== -1) continue;
      const lab = labs[n] ?? BLACK;
      const count = members.length;
      if (ciede2000(lab, [sumL / count, sumA / count, sumB / count]) >= tolerance) continue;
      region[n] = id;
      members.push(n);
      sumL += lab[0];
      sumA += lab[1];
      sumB += lab[2];
    }
  }
  return members;
}

/** Sets every member of `members` to their mean sRGB colour. */
function flatten(data: Uint8ClampedArray, out: Uint8ClampedArray, members: readonly number[]): void {
  for (let c = 0; c < 3; c++) {
    let sum = 0;
    for (const m of members) sum += data[m * 4 + c] ?? 0;
    for (const m of members) out[m * 4 + c] = sum / members.length;
  }
}

/**
 * Flattens the background of a stud image (spec retouch.md): regions grown from the top and side
 * borders, whose seeds cover at least MIN_BORDER_SHARE of those borders, take their mean colour.
 */
export function flattenBackground(image: RgbaImage, tolerance: number): RgbaImage {
  const { width, height, data } = image;
  const labs: Lab[] = [];
  for (let i = 0; i < width * height; i++) labs.push(toLab(data[i * 4] ?? 0, data[i * 4 + 1] ?? 0, data[i * 4 + 2] ?? 0));
  const grid: Grid = { labs, width, tolerance, region: new Int32Array(width * height).fill(-1) };
  const { region } = grid;
  const border = seeds(width, height);
  const out = new Uint8ClampedArray(data);
  let id = 0;
  for (const seed of border) {
    if (region[seed] !== -1) continue;
    const members = grow(grid, seed, id);
    const seeded = border.filter((s) => region[s] === id).length;
    id++;
    if (seeded >= MIN_BORDER_SHARE * border.length) flatten(data, out, members);
  }
  return { width, height, data: out };
}
