import { STUDS_PER_PLATE, studsOf, type Mosaic } from './mosaic';
import type { PaletteColour } from './palette';

/** One base plate of the build plan (spec kit.md). */
export interface PlatePlan {
  /** 0-based column, left to right. */
  readonly column: number;
  /** 0-based row, top to bottom. */
  readonly row: number;
  /** 16 × 16 palette indices, row-major. */
  readonly cells: Uint8Array;
  /** Colours used on this plate, in palette order. */
  readonly legend: readonly PaletteColour[];
}

/** Tiles of one colour: `quantity` to place, plus `spares`. */
export interface TileLine {
  readonly colour: PaletteColour;
  readonly quantity: number;
  readonly spares: number;
}

export interface BillOfMaterials {
  readonly tiles: readonly TileLine[];
  readonly basePlates: number;
}

/** Spare rates the buyer can choose, in percent. */
export const SPARE_PERCENTS = [0, 2, 5] as const;
export type SparePercent = (typeof SPARE_PERCENTS)[number];
export const DEFAULT_SPARE_PERCENT: SparePercent = 2;

function plateCells(mosaic: Mosaic, column: number, row: number): Uint8Array {
  const width = studsOf(mosaic.size).width;
  const cells = new Uint8Array(STUDS_PER_PLATE * STUDS_PER_PLATE);
  for (let y = 0; y < STUDS_PER_PLATE; y++) {
    const start = (row * STUDS_PER_PLATE + y) * width + column * STUDS_PER_PLATE;
    cells.set(mosaic.cells.subarray(start, start + STUDS_PER_PLATE), y * STUDS_PER_PLATE);
  }
  return cells;
}

function usedColours(mosaic: Mosaic, cells: Uint8Array): PaletteColour[] {
  const used = new Set(cells);
  return mosaic.palette.colours.filter((_, index) => used.has(index));
}

/** Splits the mosaic into plates in reading order, which is the build order. */
export function buildPlan(mosaic: Mosaic): PlatePlan[] {
  const plates: PlatePlan[] = [];
  for (let row = 0; row < mosaic.size.platesHigh; row++) {
    for (let column = 0; column < mosaic.size.platesWide; column++) {
      const cells = plateCells(mosaic, column, row);
      plates.push({ column, row, cells, legend: usedColours(mosaic, cells) });
    }
  }
  return plates;
}

/** Tiles per used colour in palette order, with `ceil(quantity × sparePercent / 100)` spares. */
export function billOfMaterials(mosaic: Mosaic, sparePercent: SparePercent): BillOfMaterials {
  const counts = new Uint32Array(mosaic.palette.colours.length);
  for (const index of mosaic.cells) counts[index] = (counts[index] ?? 0) + 1;
  const tiles = mosaic.palette.colours.flatMap((colour, index) => {
    const quantity = counts[index] ?? 0;
    return quantity === 0 ? [] : [{ colour, quantity, spares: Math.ceil((quantity * sparePercent) / 100) }];
  });
  return { tiles, basePlates: mosaic.size.platesWide * mosaic.size.platesHigh };
}
