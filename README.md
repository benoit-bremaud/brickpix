# brickpix

Turn any photo into a brick mosaic. Import a picture, retouch it (crop, contrast, colours),
preview it as a grid of 1×1 round tiles on 16×16 base plates, then order the kit: a build plan
per plate and the list of parts to buy.

Everything runs in the browser. No photo ever leaves your machine.

## Status

V1 features delivered (bricks 1–6), all in the browser:

- Import a photo; it never leaves your machine.
- Retouch before quantisation: crop, zoom, rotate, mirror, brightness, contrast, saturation,
  sharpen, moods, background simplification.
- Live preview quantised to 17 colours of 1×1 round tiles, by perceptual distance (CIEDE2000),
  with optional Floyd–Steinberg dithering.
- Mosaic size in multiples of 16×16 plates, up to 8 plates per side.
- The kit: build plan per plate, bill of materials with a spare rate, BrickLink wanted list (XML).
- Printable kit and keyboard-accessible controls.

## Next

- Custom domain (#11), supplier study (#12), cost estimate (#13), optional frame (#14).

## Development

Needs Node 22.22.2+, 24.15+ or 26+ (the range jsdom 30 supports, see `engines`) and pnpm 10: `corepack enable` picks the pinned version on Node 22 and 24; Node 25+ no longer ships Corepack, so install it with `npm install -g pnpm@10` there.

```bash
pnpm install
pnpm dev        # local dev server
pnpm verify     # lint, typecheck, tests with coverage, build (same as CI)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for branches, gates and the release flow.

## Licence

Public for transparency until the first production deploy, then private. No licence is granted:
all rights reserved. LEGO® is a trademark of the LEGO Group, which does not sponsor, authorise or
endorse this project.
