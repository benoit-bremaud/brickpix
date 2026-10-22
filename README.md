# brickpix

Turn any photo into a LEGO Art mosaic. Import a picture, retouch it (crop, contrast, colours),
preview it as a grid of 1×1 round tiles on 16×16 base plates, then order the kit: a build plan
per plate and the list of parts to buy.

Everything runs in the browser. No photo ever leaves your machine.

## Status

Brick 1 (bootstrap) done: tooling, security CI, documentation skeleton, Cloudflare Workers deploy.
No image logic yet: brick 2 is the UML conception, see [docs/product/vision.md](docs/product/vision.md)
and [docs/architecture/README.md](docs/architecture/README.md).

## Planned (V1)

- Retouch before quantisation: crop, brightness, contrast, saturation, sharpen.
- Quantisation to the real palette of LEGO 1×1 round tiles, perceptual colour distance, optional
  dithering, live preview.
- Any mosaic size in multiples of 16×16 plates, from 48×48 up to giant pieces.
- "Aperçu" then "Commander mon kit": build plan per plate, bill of materials, BrickLink wanted list.

## Development

Needs Node 22.21 or later and pnpm 10 (`corepack enable` picks the pinned version).

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
