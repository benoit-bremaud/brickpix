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
    UI->>Canvas: decode(File) via createImageBitmap
    Canvas-->>UI: RgbaImage (Uint8ClampedArray, w, h)

    loop each retouch change
        Maker->>UI: crop / brightness / contrast / saturation / background
        UI->>Domain: retouch(source, RetouchSettings)
        Domain-->>UI: RgbaImage (retouched)
        UI->>Canvas: draw retouched image
    end

    Maker->>UI: Choose size (platesWide × platesHigh)
    Maker->>UI: Aperçu
    UI->>Domain: resample(retouched, 16·platesWide, 16·platesHigh)
    UI->>Domain: quantise(small, palette, dithering)
    Domain-->>UI: Mosaic (grid of palette indices)
    UI->>Canvas: render tiles as round studs

    Maker->>UI: Commander mon kit
    UI->>Domain: buildPlan(mosaic)
    Domain-->>UI: PlatePlan[] (row-major, 16 × 16 each)
    UI->>Domain: billOfMaterials(mosaic)
    Domain-->>UI: BillOfMaterials (tiles per colour, base plates)
    opt Export the BrickLink wanted list
        Maker->>UI: Export
        UI->>Domain: toBrickLinkXml(bom)
        Domain-->>UI: string (XML)
        UI-->>Maker: download via Blob URL (local, no upload)
    end
```

## Notes

- Decoding and drawing are the only Canvas steps; every computation is a pure domain function over
  typed arrays, so it is unit-testable without a DOM.
- Retouch always restarts from the decoded source, never from the previous result, so adjustments
  do not accumulate rounding loss.
- If quantising a giant mosaic proves slow, the same domain calls can move into a Web Worker
  without changing the domain (decision deferred until measured).
