# sd Photo to kit

## Context

How a photo flows from import to the kit, across the web layer and the pure domain. Main success
scenario of the use cases in `01-use-case.md`.

## Diagram

```mermaid
sequenceDiagram
    actor Maker
    participant UI as web/Editor (React)
    participant Canvas as web/canvas (Canvas 2D)
    participant Domain as domain (pure TS)

    Maker->>UI: Import a photo (file / drop)
    UI->>Canvas: decode(File) via createImageBitmap (longest side ≤ 2048 px)
    Canvas-->>UI: source RgbaImage (Uint8ClampedArray, w, h)

    loop each size, retouch or dithering change (debounced)
        Maker->>UI: size N × M / framing / tone / Auto / mood / background / dithering
        UI->>Domain: orient(source, quarterTurns, mirrored) (only when they change)
        Domain-->>UI: oriented RgbaImage
        UI->>Domain: cropFor(w, h, MosaicSize, framing)
        Domain-->>UI: crop Rect (ratio N:M)
        UI->>Domain: resample(oriented, crop, MosaicSize)
        Domain-->>UI: studImage RgbaImage (16N × 16M)
        UI->>Domain: retouch(studImage, RetouchSettings)
        Domain-->>UI: retouched studImage (tone, sharpen, background)
        UI->>Domain: quantise(retouched, MosaicSize, palette, { dithering })
        Domain-->>UI: Mosaic (palette index per stud)
        UI->>Canvas: draw the framed photo («Cadrer») or the mosaic as round studs (Aperçu)
    end

    Maker->>UI: Commander mon kit
    Note over UI,Domain: web computeMosaic runs the same orient, crop, resample, retouch and quantise calls<br/>after painting «Préparation du kit…», on the current photo, size and settings
    UI->>Domain: buildPlan(mosaic)
    Domain-->>UI: PlatePlan[] (row-major, 16 × 16 each, with legend)
    UI->>Domain: billOfMaterials(mosaic, sparePercent = 2)
    Domain-->>UI: BillOfMaterials (tiles per colour, spares, base plates)
    UI-->>Maker: kit screen: table and HTML plate grids
    opt Export the BrickLink wanted list
        Maker->>UI: Copier / Télécharger la liste BrickLink
        UI->>Domain: toBrickLinkXml(bom)
        Domain-->>UI: string (XML)
        UI-->>Maker: clipboard, or download via Blob URL (local, no upload)
    end
```

## Notes

- Decoding and drawing are the only Canvas steps; every computation is a pure domain function over
  typed arrays, so it is unit-testable without a DOM.
- Retouch always restarts from the decoded source, never from the previous result, so adjustments
  do not accumulate rounding loss. The crop rectangle is clamped to the `N:M` ratio of the size.
  Tone, sharpen and background run on the stud grid, after resampling
  ([retouch.md](../../specs/retouch.md)); «Auto» is a separate `autoTone(studImage)` call on tap.
- The kit (plan, bill of materials, XML, screen) is specified in
  [kit.md](../../specs/kit.md).
- Crop, resample and quantise are specified in
  [quantise-mosaic.md](../../specs/quantise-mosaic.md).
- Algorithms (V1 defaults, each a domain spec to detail before its code brick): colour distance
  CIEDE2000 in CIELAB; dithering Floyd–Steinberg; resampling by area average (box filter);
  sharpen by unsharp mask; background simplification by growing regions from the top and side
  borders and flattening them to their mean colour.
- If the live chain proves slow on a giant mosaic or a large photo, the same domain calls can move
  into a Web Worker without changing the domain (decision deferred until measured, owner
  2026-10-23).
