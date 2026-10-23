/** An sRGB colour, each channel an integer in 0–255. */
export type Rgb = readonly [red: number, green: number, blue: number];

/** One colour of 1×1 round tile (BrickLink part 98138) a buyer can order. */
export interface PaletteColour {
  readonly id: string;
  readonly name: string;
  readonly rgb: Rgb;
  readonly brickLinkColorId: number;
  readonly legoElementId: string;
}

/** An ordered set of colours; a colour's index is the value stored per stud in a mosaic. */
export interface Palette {
  readonly colours: readonly PaletteColour[];
}

/**
 * The 17 colours of docs/architecture/specs/palette-round-tiles.md, in palette order.
 * Change it only through that spec.
 */
export const ROUND_TILE_PALETTE: Palette = Object.freeze({
  colours: Object.freeze(
    ([
      { id: 'white', name: 'White', rgb: [255, 255, 255], brickLinkColorId: 1, legoElementId: '4646844' },
      { id: 'light-bluish-gray', name: 'Light Bluish Gray', rgb: [160, 165, 169], brickLinkColorId: 86, legoElementId: '4650260' },
      { id: 'dark-bluish-gray', name: 'Dark Bluish Gray', rgb: [108, 110, 104], brickLinkColorId: 85, legoElementId: '6222416' },
      { id: 'black', name: 'Black', rgb: [5, 19, 29], brickLinkColorId: 11, legoElementId: '6139403' },
      { id: 'red', name: 'Red', rgb: [201, 26, 9], brickLinkColorId: 5, legoElementId: '6063445' },
      { id: 'orange', name: 'Orange', rgb: [254, 138, 24], brickLinkColorId: 4, legoElementId: '6009459' },
      { id: 'bright-light-orange', name: 'Bright Light Orange', rgb: [248, 187, 61], brickLinkColorId: 110, legoElementId: '6322822' },
      { id: 'yellow', name: 'Yellow', rgb: [242, 205, 55], brickLinkColorId: 3, legoElementId: '6070714' },
      { id: 'lime', name: 'Lime', rgb: [187, 233, 11], brickLinkColorId: 34, legoElementId: '6057878' },
      { id: 'medium-azure', name: 'Medium Azure', rgb: [54, 174, 191], brickLinkColorId: 156, legoElementId: '6322819' },
      { id: 'blue', name: 'Blue', rgb: [0, 85, 191], brickLinkColorId: 7, legoElementId: '6009460' },
      { id: 'bright-pink', name: 'Bright Pink', rgb: [228, 173, 200], brickLinkColorId: 104, legoElementId: '6284587' },
      { id: 'tan', name: 'Tan', rgb: [228, 205, 158], brickLinkColorId: 2, legoElementId: '6139649' },
      { id: 'dark-tan', name: 'Dark Tan', rgb: [149, 138, 115], brickLinkColorId: 69, legoElementId: '6322841' },
      { id: 'medium-nougat', name: 'Medium Nougat', rgb: [170, 125, 85], brickLinkColorId: 150, legoElementId: '6055383' },
      { id: 'reddish-brown', name: 'Reddish Brown', rgb: [88, 42, 18], brickLinkColorId: 88, legoElementId: '6133854' },
      { id: 'dark-brown', name: 'Dark Brown', rgb: [53, 33, 0], brickLinkColorId: 120, legoElementId: '6322813' },
    ] satisfies PaletteColour[]).map((colour) => Object.freeze(colour)),
  ),
});
