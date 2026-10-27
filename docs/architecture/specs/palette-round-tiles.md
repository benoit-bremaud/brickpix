# Spec: palette of 1×1 round tiles

Status: validated by the owner on 2026-10-23 (issue #7). Implements `PaletteColour` and `Palette`
of [04-class.md](../diagrams/mosaic/04-class.md).

## Part

BrickLink part `98138`, *Tile, Round 1 x 1*. Only this part is in scope for V1 (see
[vision](../../product/vision.md)).

## Selection criteria

A colour is in the palette when all of these hold:

1. **Opaque, solid.** No transparent, opal, glitter, metallic or glow colours: they do not render
   as a flat pixel.
2. **In production.** Used in official sets released in 2025 or 2026 (Rebrickable inventories).
3. **Stocked.** More than 2,000 lots for sale on BrickLink, so a buyer can order hundreds of
   tiles of it.

BrickLink is the supplier basis until the supplier study (#12) says otherwise; the table is then
revised against that supplier's colour chart.

Decision (MCDA, owner, 2026-10-23): 17 colours, the 16 most stocked plus Dark Brown, which fills
the gap between Black and Reddish Brown for dark hair and skin and is the second colour of the
official Beatles art-mosaic set. Rejected: 16 colours (no dark brown), about 35 colours (several below 500
lots).

## Colours

The order is the palette order: it fixes the palette index stored in `Mosaic.cells` and the plate
legend order. RGB is Rebrickable's screen approximation of the plastic. The manufacturer colour and element ids are provenance
only; the domain type does not carry them.

| # | id | Name (BrickLink) | RGB | BrickLink id | Manufacturer colour id | Manufacturer element id |
|---|---|---|---|---|---|---|
| 0 | `white` | White | `#FFFFFF` | 1 | 1 | 4646844 |
| 1 | `light-bluish-gray` | Light Bluish Gray | `#A0A5A9` | 86 | 194 | 4650260 |
| 2 | `dark-bluish-gray` | Dark Bluish Gray | `#6C6E68` | 85 | 199 | 6222416 |
| 3 | `black` | Black | `#05131D` | 11 | 26 | 6139403 |
| 4 | `red` | Red | `#C91A09` | 5 | 21 | 6063445 |
| 5 | `orange` | Orange | `#FE8A18` | 4 | 106 | 6009459 |
| 6 | `bright-light-orange` | Bright Light Orange | `#F8BB3D` | 110 | 191 | 6322822 |
| 7 | `yellow` | Yellow | `#F2CD37` | 3 | 24 | 6070714 |
| 8 | `lime` | Lime | `#BBE90B` | 34 | 119 | 6057878 |
| 9 | `medium-azure` | Medium Azure | `#36AEBF` | 156 | 322 | 6322819 |
| 10 | `blue` | Blue | `#0055BF` | 7 | 23 | 6009460 |
| 11 | `bright-pink` | Bright Pink | `#E4ADC8` | 104 | 222 | 6284587 |
| 12 | `tan` | Tan | `#E4CD9E` | 2 | 5 | 6139649 |
| 13 | `dark-tan` | Dark Tan | `#958A73` | 69 | 138 | 6322841 |
| 14 | `medium-nougat` | Medium Nougat | `#AA7D55` | 150 | 312 | 6055383 |
| 15 | `reddish-brown` | Reddish Brown | `#582A12` | 88 | 192 | 6133854 |
| 16 | `dark-brown` | Dark Brown | `#352100` | 120 | 308 | 6322813 |

## Availability

Source and date for every row: BrickLink catalogue (known colours and lots for sale of `98138`),
Rebrickable CSV downloads (colours, element ids, set inventories), checked 2026-10-23.

| id | BrickLink lots | Sets 2025-26 |
|---|---|---|
| white | 7,732 | 171 |
| light-bluish-gray | 7,232 | 220 |
| black | 7,123 | 183 |
| red | 6,672 | 130 |
| yellow | 6,407 | 92 |
| bright-pink | 6,404 | 56 |
| lime | 5,668 | 44 |
| blue | 5,645 | 59 |
| orange | 5,205 | 45 |
| medium-nougat | 4,831 | 40 |
| reddish-brown | 4,759 | 88 |
| tan | 4,332 | 66 |
| dark-bluish-gray | 4,307 | 130 |
| medium-azure | 3,397 | 47 |
| bright-light-orange | 3,200 | 42 |
| dark-tan | 2,752 | 39 |
| dark-brown | 2,329 | 36 |

Lots include used lots. The manufacturer's Pick a Brick stock could not be checked.

## Invariants for the domain table

- 17 entries, in the order above; `id` values are unique kebab-case strings.
- Each RGB channel is an integer in 0–255; no two colours share an RGB value.
- BrickLink ids and manufacturer element ids are unique (checked in review; the domain type does not carry element ids).
- The table is static, frozen data in `src/domain`; it changes only through this spec.
