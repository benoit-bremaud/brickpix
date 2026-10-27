import type { Palette } from './palette';

/** Studs per side of one base plate. */
export const STUDS_PER_PLATE = 16;

/** Largest number of plates per side (spec quantise-mosaic.md, owner 2026-10-27). */
export const MAX_PLATES = 8;

/** An RGBA image, row-major, 4 bytes per pixel. */
export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

/** A pixel rectangle inside an image. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Mosaic size in 16 × 16 base plates. */
export interface MosaicSize {
  readonly platesWide: number;
  readonly platesHigh: number;
}

/** One palette index per stud, row-major over `studsOf(size)`. */
export interface Mosaic {
  readonly size: MosaicSize;
  readonly palette: Palette;
  readonly cells: Uint8Array;
}

/** The common 48 × 48 art-mosaic size (3 × 3 plates). */
export const DEFAULT_SIZE: MosaicSize = Object.freeze({ platesWide: 3, platesHigh: 3 });

/** Throws a RangeError unless both sides are integers in 1..MAX_PLATES. */
export function assertMosaicSize(size: MosaicSize): void {
  for (const plates of [size.platesWide, size.platesHigh]) {
    if (!Number.isInteger(plates) || plates < 1 || plates > MAX_PLATES) {
      throw new RangeError(`Plates per side must be an integer in 1..${MAX_PLATES}, got ${plates}.`);
    }
  }
}

/** Stud grid dimensions of a size. */
export function studsOf(size: MosaicSize): { readonly width: number; readonly height: number } {
  return { width: size.platesWide * STUDS_PER_PLATE, height: size.platesHigh * STUDS_PER_PLATE };
}
