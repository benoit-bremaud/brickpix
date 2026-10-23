# Vision

## One sentence

Give someone who loves LEGO a mosaic of a photo that matters to them: the tool prepares the picture,
turns it into a buildable grid of 1×1 round tiles, and produces everything needed to order the parts
and build it.

## The flow

1. **Import** a photo (file picker or drag and drop). It never leaves the browser.
2. **Retouch**: crop to the mosaic aspect ratio, brightness, contrast, saturation, sharpen, optional
   background simplification. A low-resolution mosaic with ~15 colours only works on a prepared image.
3. **Aperçu**: quantise to the palette of LEGO 1×1 round tiles (perceptual colour distance, optional
   dithering) and render the mosaic live, at the chosen size.
4. **Commander mon kit**: build plan per 16×16 plate (numbered grid and colour legend), bill of
   materials (tiles per colour, base plates, optional frame), BrickLink wanted list. A cost estimate needs a price source and comes after V1.

## Sizes

Any width and height in multiples of 16 studs: 48×48 (the LEGO Art standard, 3×3 plates), 64×64,
96×64, and giant pieces assembled from many plates. The build plan is always split per plate so a
giant mosaic is built one plate at a time.

## Out of scope for V1

- Accounts, saved projects on a server, sharing links with image data.
- Automatic purchase. The tool produces the list; the buyer orders on BrickLink or at a LEGO store.
- Parts other than 1×1 round tiles (1×1 square tiles, plates) may come later as an option.

## Prior art

`debkbanerji/lego-art-remix`, `ryantimpe/brickr` (R), `lucaswo/Pic2Brick`. All quantise a photo;
none lets the user retouch it interactively first. That step is the differentiator.
