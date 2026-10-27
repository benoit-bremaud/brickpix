# Kit — build plan, bill of materials, BrickLink wanted list

Implements «Commander mon kit» (use case UC5, `KitReady` in
[05-state-editor.md](../diagrams/mosaic/05-state-editor.md)) over the `Mosaic` of
[quantise-mosaic.md](quantise-mosaic.md). Domain functions are pure; the web layer renders,
prints, copies and downloads.

## Build plan — `buildPlan(mosaic): PlatePlan[]`

- One `PlatePlan` per base plate in reading order (left to right, then top to bottom), which is
  the build order: index `row × platesWide + column`, `column` and `row` 0-based. The screen
  numbers plates 1..N and also shows «colonne c, rangée r» (1-based).
- `cells`: the 16 × 16 slice of `Mosaic.cells` for that plate, row-major, palette indices.
- `legend`: the palette colours used on that plate, in palette order, no duplicates.
- Legend number of a colour = its palette index + 1 (1–17), the same on every plate, in the bill
  of materials and on screen.

## Bill of materials — `billOfMaterials(mosaic, sparePercent): BillOfMaterials`

- `sparePercent` is one of `0`, `2`, `5` (an integer, no float rounding); the kit screen defaults to `2`.
- `tiles`: one `TileLine` per palette colour with at least one stud, in palette order:
  - `quantity`: exact number of studs of that colour (tiles to place);
  - `spares`: `ceil(quantity × sparePercent / 100)`, so at least 1 for every used colour as soon
    as the rate is above 0;
  - tiles to buy = `quantity + spares`.
- `basePlates = platesWide × platesHigh`.
- Invariant: the sum of `quantity` equals `256 × basePlates`.

## BrickLink wanted list — `toBrickLinkXml(bom): string`

BrickLink XML upload format ([help 207](https://www.bricklink.com/help.asp?helpID=207)). The text
starts with `<INVENTORY>`, nothing before it (the buyer pastes it into BrickLink).

```xml
<INVENTORY>
  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>98138</ITEMID><COLOR>11</COLOR><MINQTY>420</MINQTY><CONDITION>N</CONDITION></ITEM>
  …
  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>91405</ITEMID><COLOR>11</COLOR><MINQTY>9</MINQTY><CONDITION>N</CONDITION></ITEM>
</INVENTORY>
```

- One `ITEM` per tile line: part `98138`, `COLOR` = `brickLinkColorId`, `MINQTY` = tiles to buy,
  in palette order; then one `ITEM` for the base plates: part `91405` *Plate 16 x 16*, Black (11),
  `MINQTY` = `basePlates` (BrickLink catalogue, 2026-10-27: 91405 known in Black, 871 lots for
  sale).
- `CONDITION` is `N` (new) on every item. No `REMARKS`, `NOTIFY` or `MAXPRICE`.
- Values are integers and fixed ids; no user text enters the XML, so no escaping is needed.

## Kit screen (web)

- Buttons: «Commander mon kit», «Retour à l'édition», «Imprimer le plan», «Copier la liste
  BrickLink», «Télécharger la liste BrickLink» (explicit labels, WCAG 2.4.6 and 2.5.3).
- «Commander mon kit» recomputes the mosaic synchronously from the current photo, size and
  dithering (it does not reuse the debounced preview), then shows the kit. «Retour à l'édition»
  returns to `Editing` and discards it.
- Bill of materials: a table with four columns «N°», «Couleur» (swatch and BrickLink name), «À
  poser», «À acheter»; the footer gives the tile totals and the base plates. Spares read as the
  difference of the last two columns.
- Spares: a `fieldset` «Pièces de rechange» of three native radios «Aucune», «2 % (conseillé)»,
  «5 %» (default 2 %); a change updates the table and the XML.
- Plan: per plate, a caption «Plaque N (colonne c, rangée r)», a 16 × 16 HTML/CSS grid of round
  cells in the stud colour with the legend number, and the plate legend.
- Number ink: black or white, whichever has the higher WCAG contrast ratio with the stud colour.
  On the 17 colours the lowest ratio is 5.2:1 (Dark Bluish Gray, white ink), above AA 4.5:1.
- «Imprimer le plan» calls `window.print()`; a `@media print` style hides the controls, prints the
  bill of materials on the first page, then one plate per page (A4: about 11 mm per cell).
- «Copier la liste BrickLink» writes the XML with `navigator.clipboard.writeText`; on failure it
  shows «Copie impossible, utilisez Télécharger».
- «Télécharger la liste BrickLink» downloads `brickpix-{W}x{H}-plaques-bricklink.xml` (plates,
  e.g. `brickpix-3x3-plaques-bricklink.xml`) through a Blob URL created and revoked locally.
- Nothing is uploaded; the XML holds part ids, colour ids and quantities only.

## Decisions (owner, 2026-10-27)

| Point | Choice | MCDA |
|---|---|---|
| Legend numbering | global, palette index + 1 | 445 vs per-plate 360, swatches 260 |
| Base plates in the XML | `91405` Black | 435 vs toggle 415, tiles only 375 |
| Print | `window.print()` + print CSS | 475 vs PNG 395, PDF library 365 |
| Plate order | reading order, 1..N + column/row | 440 vs A1 coordinates 345, serpentine 315 |
| Spares | selector 0 / 2 / 5 %, min 1 per colour | 430 vs checkbox 420, exact 365, forced 330 |
| Spares default | 2 % | 415 vs 0 % 385, 5 % 385, forced choice 375 |
| Plan rendering | HTML/CSS grid (vector print, testable, light on memory) | 445 vs SVG 405, canvas→PNG 375, canvas 2× 335 |
| Kit trigger | synchronous recompute on click | 440 vs keyed memo 430, flush 375, disabled button 355 |
| XML fields | minimal + `CONDITION N` | 460 vs minimal 430, + `REMARKS` 395 |
| Export | copy and download | 440 vs textarea + download 435, download 400, copy 360 |
| File name | `brickpix-{W}x{H}-plaques-bricklink.xml` | 465 vs studs 440, photo name 370, fixed 345 |
| Spare rounding | `ceil(q × percent / 100)` | 470 vs `max(1, ceil)` 450, `round` 340 |
| Table columns | N°, colour, to place, to buy | 460 vs 6 responsive 440, 3 columns 420, 6 columns 380 |
| Print layout | bill of materials, then one plate per page | 440 vs per-plate print 430, 1-or-4 choice 410, 4 per page 350 |
| Number ink | black or white by WCAG contrast | 450 vs fixed per colour 410, white + outline 340 |
| Labels | explicit | 480 vs titled block 445, short + aria-label 340, short 325 |
| Spare control | native radios in a fieldset | 480 vs segmented 470, select 430, slider 255 |
| Spare option text | «Aucune», «2 % (conseillé)», «5 %» | 460 vs + help line 455, bare percents 375 |

Follow-ups outside this brick: #20 (compare sizes), #21 (RAL), #22 (API or library), #23
(LEGO-style building manual, including the surprise mode; MCDA 465 and 470).
