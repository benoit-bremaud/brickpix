# cmp brickpix

## Context

Which modules exist and who depends on whom. The dependency rule: `domain` imports nothing (no
package, no DOM, no React); `web` depends on `domain`, never the reverse.

## Diagram

```mermaid
flowchart TB
    subgraph web["src/web (React + Canvas)"]
        Editor["Editor<br/>(state, screens)"]
        ImageIO["canvas/imageIO<br/>(decode File, draw photo)"]
        Render["canvas/renderMosaic<br/>(round studs preview)"]
        Kit["Kit<br/>(bill of materials table, HTML plate grids, print CSS)"]
        Export["export<br/>(clipboard copy, Blob URL download)"]
    end

    subgraph domain["src/domain (pure TypeScript)"]
        Retouch["retouch"]
        Crop["crop<br/>(default centred crop, until retouch)"]
        Resample["resample"]
        Palette["palette<br/>(1 × 1 round tile colours)"]
        Quantise["quantise<br/>(nearest colour, dithering)"]
        Colour["colour<br/>(CIELAB, CIEDE2000)"]
        Mosaic["mosaic<br/>(RgbaImage, MosaicSize, Mosaic types)"]
        Plan["buildPlan"]
        Bom["billOfMaterials"]
        BrickLink["brickLinkXml"]
    end

    Editor --> ImageIO
    Editor --> Render
    Editor --> Kit
    Kit --> Export
    Editor --> Retouch
    Editor --> Crop
    Editor --> Resample
    Editor --> Quantise
    Kit --> Plan
    Kit --> Bom
    Kit --> BrickLink
    Quantise --> Palette
    Quantise --> Colour
    Bom --> Palette
    BrickLink --> Bom
    Plan --> Palette
```

## Notes

- `mosaic` holds the shared domain types and size rules; every domain module may import it (arrows
  omitted for legibility). `crop` folds into `retouch` in #10.
- No network egress: there is no API client component. Outputs leave the page only on the user's
  action: the printed plan, the BrickLink XML copied to the clipboard or downloaded as a file.
- The plan is an HTML/CSS grid, not a canvas (spec [kit.md](../../specs/kit.md)): vector print,
  testable in the DOM, light on memory for 8 × 8 plates.
- The purity of `src/domain` is enforced by `tsconfig.domain.json` (no DOM lib) and the ESLint
  import rule set up in brick 1.
