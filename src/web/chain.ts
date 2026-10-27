import { cropFor, type Framing } from "../domain/crop";
import type { Mosaic, MosaicSize, RgbaImage } from "../domain/mosaic";
import { ROUND_TILE_PALETTE } from "../domain/palette";
import { quantise, type QuantiseOptions } from "../domain/quantise";
import { resample } from "../domain/resample";
import { retouch, type RetouchSettings } from "../domain/retouch";

/** The framed photo resampled to the stud grid, before any tone step (Auto reads it). */
export function studsFor(oriented: RgbaImage, size: MosaicSize, framing: Framing): RgbaImage {
  return resample(oriented, cropFor(oriented.width, oriented.height, size, framing), size);
}

/** The photo-to-mosaic chain of spec retouch.md on an oriented photo: crop, resample, retouch, quantise. */
export function computeMosaic(oriented: RgbaImage, size: MosaicSize, settings: RetouchSettings, options: QuantiseOptions): Mosaic {
  return quantise(retouch(studsFor(oriented, size, settings.framing), settings), size, ROUND_TILE_PALETTE, options);
}
