import { relativeLuminance } from "../../domain/colour";
import type { Rgb } from "../../domain/palette";

/** Colour of the number on a stud: `dark` (black) on light studs, `light` (white) on dark ones. */
export type Ink = "dark" | "light";

/** WCAG contrast ratio between two relative luminances. */
export function contrastRatio(first: number, second: number): number {
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** The ink, black or white, with the higher WCAG contrast on `rgb` (spec kit.md). */
export function inkOn(rgb: Rgb): Ink {
  const luminance = relativeLuminance(...rgb);
  return contrastRatio(luminance, 0) >= contrastRatio(luminance, 1) ? "dark" : "light";
}
