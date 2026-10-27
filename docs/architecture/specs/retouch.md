# Spec: retouch before quantisation

Status: validated by the owner on 2026-10-27 (issue #10). Implements `retouch` of [03-component.md](../diagrams/mosaic/03-component.md) and the
`Retouch the photo` use case of [01-use-case.md](../diagrams/mosaic/01-use-case.md). Replaces the
default crop of [quantise-mosaic.md](quantise-mosaic.md).

## Principles

- Few controls at rest; each tap reveals only the options of its tool (progressive disclosure).
  Anything finer belongs in a real photo editor, before import.
- What is applied is visible: Auto and the moods fill the sliders, they never apply a hidden step.
- Retouch always restarts from the decoded source, never from a previous result.

## Chain

`orient → crop → resample → brightness → contrast → saturation → sharpen → background → quantise`

- Orientation and crop work on the decoded source (≤ 2048 px). Every tonal step works on the stud
  grid after resampling (at most 128 × 128), so the live preview stays fast on a phone (#28).

## Framing (tool «Cadrer»)

`Framing = { zoom, centreX, centreY, quarterTurns, mirrored }`.

- `orient(source, quarterTurns, mirrored)`: rotation by `quarterTurns × 90°` clockwise
  (`0..3`), then a horizontal mirror if `mirrored`. Recomputed only when one of them changes.
- `cropFor(width, height, size, framing): Rect`: the cover-fit rectangle of ratio
  `platesWide : platesHigh` (the former `defaultCrop`) divided by `zoom` (`1..8`, 1 = cover fit),
  centred on (`centreX × width`, `centreY × height`), then shifted to stay inside the image.
  Integer bounds, at least 1 × 1. `zoom = 1, centre = (0.5, 0.5)` gives the former default crop.
- Size lives in this tool: `− / +` per side, and dragging a side or corner of the frame sets that
  axis to `round(plates × newLength / oldLength)`, clamped to `1..MAX_PLATES`; the frame snaps to the
  new ratio. The size is recalled in the toolbar («⬚ 3×3») and next to «Commander mon kit».
- Gestures: drag to pan, pinch or wheel to zoom, a zoom slider, arrow keys pan by 5 % of the frame,
  `+ / −` zoom. Buttons: «↻» (quarter turn), «⇆» (mirror), «Recentrer» (zoom 1, centre 0.5).
- While «Cadrer» is open, the canvas shows the oriented photo, dimmed outside the frame; the other
  tools show the mosaic.

## Tone (tool «Ambiance»)

Integers in `−100..100`, default 0, applied per channel in sRGB 0–255, in this order, each result
clamped to 0–255:

- brightness `b`: `c + 1.28 × b`
- contrast `k`: `(c − 128) × (1 + k / 100) + 128`
- saturation `s`: `Y + (c − Y) × (1 + s / 100)`, `Y` the Rec. 709 luma `0.2126 R + 0.7152 G + 0.0722 B`

Sharpen `p` in `0..100`, default 0: unsharp mask `c + 2 × (p / 100) × (c − blur(c))`, `blur` the
separable 3 × 3 Gaussian (1-2-1)/4, edges replicated, clamped to 0–255.

Panel: «Auto», then the moods, then «Plus ▾» which reveals the four sliders and the dithering
toggle (dithering moves here from the main controls).

- **Auto** (one-shot, on tap): on the resampled studs before tone, luma percentiles `p1` (1 %) and
  `p99` (99 %); `f = min(2, max(0, 255 / max(1, p99 − p1)))`, `k = round(100 × (f − 1))`,
  `b = round((128 − p1 − 128 / f) / 1.28)` clamped to `−100..100` (`b = 0` when `f = 0`),
  `s = 15`, sharpen unchanged. A later crop change does not recompute it.
- **Moods** set `(b, k, s)`: Naturel `(0, 0, 0)`, Pop `(0, 20, 40)`, Doux `(0, −20, −20)`,
  N&B `(0, 0, −100)`. Sharpen unchanged. Naturel is the tone reset.

## Background (tool «Fond»)

`{ enabled, tolerance }`, off by default, tolerance ΔE2000 in `5..20`, default 10. The tolerance
slider shows only when enabled. Runs on the toned, sharpened studs:

1. Seeds: every stud of the top row and of the left and right columns (not the bottom row, where a
   subject usually rests).
2. From each seed not yet in a region, grow a 4-connected region: a neighbour joins when its
   CIEDE2000 distance to the running mean colour (CIELAB) of the region is below `tolerance`.
3. A region whose seeds cover at least 10 % of the seeded border studs is flattened to its mean
   sRGB colour; smaller regions are left as they are.

Known limit: a background of the same colour as the subject; on-device AI cut-out is #36.

## Before / after

- A long press (500 ms) on the preview, or holding Space while it has focus, shows the framed
  photo without retouch; release returns to the mosaic. A one-time hint names the gesture.

## State and reset

`RetouchSettings = { framing, brightness, contrast, saturation, sharpen, background }`.

- A new photo resets the retouch settings and keeps the size (05-state).
- Per-tool reset: «Recentrer» (framing, keeps the turns and mirror), «Naturel» (tone), the «Fond»
  switch. No global reset, no undo history.
- One tool panel open at a time; «Cadrer» opens after an import.

## Invariants

- Same input, same output (no randomness, no time).
- All neutral settings (`zoom 1`, centre 0.5, no turn, no mirror, tone 0, sharpen 0, background off)
  give exactly the mosaic of [quantise-mosaic.md](quantise-mosaic.md).
- Every crop lies inside the oriented image and has the ratio of the size within one pixel.
- Each tonal step with value 0 is the identity.

## Out of scope (owner, 2026-10-27)

- Limiting the number of colours: #35. On-device AI cut-out: #36.
- Fine straightening, sepia and other tints, a global reset, undo history.
