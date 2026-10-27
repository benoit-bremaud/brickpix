# Spec: from photo to mosaic (crop, resample, quantise)

Status: validated by the owner on 2026-10-27 (issue #8). Implements `resample` and `quantise` of
[03-component.md](../diagrams/mosaic/03-component.md) and the `Editing` loop of
[02-sequence-photo-to-kit.md](../diagrams/mosaic/02-sequence-photo-to-kit.md), over the palette of
[palette-round-tiles.md](palette-round-tiles.md).

## Mosaic size

- `MosaicSize = { platesWide, platesHigh }`, integers in `1..8` (`MAX_PLATES = 8`).
  Default 3 × 3. Studs: `16 × platesWide` by `16 × platesHigh`.
- A value outside the range or not an integer is rejected by the domain (`RangeError`); the UI
  clamps its inputs so it never sends one.

## Default crop (until the retouch brick, #10)

- The crop is the largest rectangle of ratio `platesWide : platesHigh` centred in the photo
  (cover fit). Integer pixel bounds, at least 1 × 1.
- #10 replaces it by the user's framing ([retouch.md](retouch.md)); neutral framing gives this
  crop.

## Decode (web)

- The photo is decoded in the browser and downscaled so its longest side is at most 2048 px
  (`MAX_DECODE_SIDE`), well above the 128 studs of the largest side. It bounds memory on large
  photos (a 100-megapixel file would otherwise need about 400 MB) and stays under browser canvas
  limits.

## Resample

- Input: the photo and the crop rectangle. Output: an `RgbaImage` of `16N × 16M` studs.
- Area average (box filter): each stud averages, in sRGB, every source pixel its footprint covers,
  weighted by the covered fraction. If the crop is smaller than the stud grid, each stud takes the
  nearest source pixel (upscale).
- Alpha: a transparent pixel is composited over white before averaging (a PNG with transparency
  gives white tiles, not black).

## Quantise

- Colour distance: CIEDE2000 (kL = kC = kH = 1) in CIELAB, D65 white, from sRGB through the
  standard sRGB transfer curve. The palette's Lab values are computed once.
- Without dithering: each stud gets the palette index of its nearest colour. Ties go to the lower
  index (deterministic).
- With dithering: Floyd–Steinberg (7/16, 3/16, 5/16, 1/16), serpentine scan, off by default, error diffused in
  sRGB 0–255 and clamped per channel, nearest colour by CIEDE2000.
- Output: `Mosaic.cells`, one palette index per stud, row-major.

## Preview (web)

- Each stud is drawn as a filled disc of its palette colour on a dark base-plate background.
- The chain (crop, resample, quantise, draw) reruns 150 ms after the last size or dithering
  change (debounce). An import runs it at once.

## Decisions (owner, 2026-10-27)

- `MAX_PLATES = 8` (MCDA 470/500, against 12 at 430 and 16 at 380). Measured on a laptop,
  naive CIEDE2000 over random pixels: 3×3 15 ms, 8×8 88 ms, 12×12 210 ms, 16×16 335 ms; mobile
  is about 3–4 times slower. Raising it later needs a per-colour cache or the deferred Web Worker.
- Dithering off by default (MCDA 430/500 against 335): flat areas like LEGO Art sets and an
  easier plan; the toggle stays available.

## Invariants

- Same input, same output (no randomness, no time).
- Every cell is a valid palette index; `cells.length = 256 × platesWide × platesHigh`.
- A photo made only of one palette colour maps to that index everywhere, with and without
  dithering.
