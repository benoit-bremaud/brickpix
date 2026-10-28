# brickpix

Turn any photo into a brick mosaic. Import a picture, retouch it (crop, contrast, colours),
preview it as a grid of 1×1 round tiles on 16×16 base plates, then order the kit: a build plan
per plate and the list of parts to buy.

Everything runs in the browser. No photo ever leaves your machine.

Live at <https://brickpix.benoitbremaud.fr>.

## Status

V1 in progress: import, size, live preview, retouch and the kit (build plan, bill of materials) work
end to end. Product intent in [docs/product/vision.md](docs/product/vision.md), conception in
[docs/architecture/README.md](docs/architecture/README.md).

## Planned (V1)

- Retouch before quantisation: crop, brightness, contrast, saturation, sharpen,
  background simplification.
- Quantisation to the real palette of 1×1 round tiles, perceptual colour distance, optional
  dithering, live preview.
- Any mosaic size in multiples of 16×16 plates, from 16×16 (one plate; 48×48 is the common art-mosaic size) up to giant pieces.
- "Aperçu" then "Commander mon kit": build plan per plate, bill of materials, BrickLink wanted list.

## Development

Needs Node 22.22.2+, 24.15+ or 26+ (the range jsdom 30 supports, see `engines`) and pnpm 10: `corepack enable` picks the pinned version on Node 22 and 24; Node 25+ no longer ships Corepack, so install it with `npm install -g pnpm@10` there.

```bash
pnpm install
pnpm dev        # local dev server
pnpm verify     # lint, typecheck, tests with coverage, build (same as CI)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for branches, gates and the release flow.

## Licence

Public for transparency, also in production (owner decision, 2026-10-28). No licence is granted:
all rights reserved. LEGO® is a trademark of the LEGO Group, which does not sponsor, authorise or
endorse this project.
