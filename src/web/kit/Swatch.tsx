import type { PaletteColour } from "../../domain/palette";

/** CSS colour of a palette entry; the value is data from the palette spec, not a design token. */
export const cssColour = (colour: PaletteColour): string => `rgb(${colour.rgb.join(" ")})`;

type Props = { readonly colour: PaletteColour };

/** A small round sample of a tile colour, decorative next to its name. */
export function Swatch({ colour }: Props) {
  return <span className="swatch" style={{ background: cssColour(colour) }} aria-hidden="true" />;
}
