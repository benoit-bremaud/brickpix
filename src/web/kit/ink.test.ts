import { describe, expect, it } from "vitest";

import { relativeLuminance } from "../../domain/colour";
import { ROUND_TILE_PALETTE } from "../../domain/palette";
import { contrastRatio, inkOn } from "./ink";

const DARK = ["white", "light-bluish-gray", "orange", "bright-light-orange", "yellow", "lime", "medium-azure",
  "bright-pink", "tan", "dark-tan", "medium-nougat"];

describe("inkOn", () => {
  it.each(ROUND_TILE_PALETTE.colours.map((colour) => [colour.id, colour] as const))(
    "picks the more contrasted ink on %s, at least WCAG AA",
    (id, colour) => {
      const ink = inkOn(colour.rgb);
      const luminance = relativeLuminance(...colour.rgb);

      expect(ink).toBe(DARK.includes(id) ? "dark" : "light");
      expect(contrastRatio(luminance, ink === "dark" ? 0 : 1)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("measures 21:1 between black and white", () => {
    expect(contrastRatio(0, 1)).toBeCloseTo(21, 10);
  });
});
