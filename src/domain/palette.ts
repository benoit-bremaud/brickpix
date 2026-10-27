/** An sRGB colour, each channel an integer in 0–255. */
export type Rgb = readonly [red: number, green: number, blue: number];

/** One colour of 1×1 round tile (BrickLink part 98138) a buyer can order. */
export interface PaletteColour {
  readonly id: string;
  readonly name: string;
  readonly rgb: Rgb;
  /** BrickLink colour id, used in the wanted list. */
  readonly brickLinkColorId: number;
}

/** An ordered set of colours; a colour's index is the value stored per stud in a mosaic. */
export interface Palette {
  readonly colours: readonly PaletteColour[];
}

const COLOURS = [
  { id: 'white', name: 'White', rgb: [255, 255, 255], brickLinkColorId: 1 },
  { id: 'light-bluish-gray', name: 'Light Bluish Gray', rgb: [160, 165, 169], brickLinkColorId: 86 },
  { id: 'dark-bluish-gray', name: 'Dark Bluish Gray', rgb: [108, 110, 104], brickLinkColorId: 85 },
  { id: 'black', name: 'Black', rgb: [5, 19, 29], brickLinkColorId: 11 },
  { id: 'red', name: 'Red', rgb: [201, 26, 9], brickLinkColorId: 5 },
  { id: 'orange', name: 'Orange', rgb: [254, 138, 24], brickLinkColorId: 4 },
  { id: 'bright-light-orange', name: 'Bright Light Orange', rgb: [248, 187, 61], brickLinkColorId: 110 },
  { id: 'yellow', name: 'Yellow', rgb: [242, 205, 55], brickLinkColorId: 3 },
  { id: 'lime', name: 'Lime', rgb: [187, 233, 11], brickLinkColorId: 34 },
  { id: 'medium-azure', name: 'Medium Azure', rgb: [54, 174, 191], brickLinkColorId: 156 },
  { id: 'blue', name: 'Blue', rgb: [0, 85, 191], brickLinkColorId: 7 },
  { id: 'bright-pink', name: 'Bright Pink', rgb: [228, 173, 200], brickLinkColorId: 104 },
  { id: 'tan', name: 'Tan', rgb: [228, 205, 158], brickLinkColorId: 2 },
  { id: 'dark-tan', name: 'Dark Tan', rgb: [149, 138, 115], brickLinkColorId: 69 },
  { id: 'medium-nougat', name: 'Medium Nougat', rgb: [170, 125, 85], brickLinkColorId: 150 },
  { id: 'reddish-brown', name: 'Reddish Brown', rgb: [88, 42, 18], brickLinkColorId: 88 },
  { id: 'dark-brown', name: 'Dark Brown', rgb: [53, 33, 0], brickLinkColorId: 120 },
] satisfies PaletteColour[];

/**
 * The 17 colours of docs/architecture/specs/palette-round-tiles.md, in palette order.
 * Change it only through that spec. Frozen at every level.
 */
export const ROUND_TILE_PALETTE: Palette = Object.freeze({
  colours: Object.freeze(COLOURS.map((colour) => Object.freeze({ ...colour, rgb: Object.freeze(colour.rgb) }))),
});
