# cmp brickpix

## Context

Which modules exist and who depends on whom. The dependency rule: `domain` imports nothing (no
package, no DOM, no React); `web` depends on `domain`, never the reverse.

## Diagram

```mermaid
flowchart TB
    subgraph web["src/web (React + Canvas)"]
        Editor["Editor<br/>(import, size, screens)"]
        Workspace["retouch/Workspace<br/>(toolbar, Cadrer, Ambiance, Fond panels)"]
        Gestures["retouch/useFrameGestures<br/>(drag, handles, pinch, wheel, keys, long press)"]
        Geometry["retouch/frameGeometry<br/>(handles, pan, zoom, stretch)"]
        Preview["usePreview<br/>(photo at once, mosaic debounced)"]
        Chain["chain<br/>(crop, resample, retouch, quantise)"]
        ImageIO["canvas/imageIO<br/>(decode File)"]
        Photo["canvas/renderPhoto<br/>(photo, frame, before)"]
        Render["canvas/renderMosaic<br/>(round studs preview)"]
        Kit["Kit<br/>(bill of materials table, HTML plate grids, print CSS)"]
        Export["export<br/>(clipboard copy, Blob URL download)"]
    end

    subgraph domain["src/domain (pure TypeScript)"]
        Crop["crop<br/>(orient, cropFor, stretchPlates)"]
        Retouch["retouch<br/>(tone, sharpen, autoTone, moods)"]
        Background["background<br/>(flattenBackground)"]
        Resample["resample"]
        Palette["palette<br/>(1 × 1 round tile colours)"]
        Quantise["quantise<br/>(nearest colour, dithering)"]
        Colour["colour<br/>(CIELAB, CIEDE2000, relative luminance)"]
        Mosaic["mosaic<br/>(RgbaImage, MosaicSize, Mosaic types)"]
        Plan["buildPlan"]
        Bom["billOfMaterials"]
        BrickLink["brickLinkXml"]
    end

    Editor --> ImageIO
    Editor --> Workspace
    Editor --> Kit
    Workspace --> Gestures
    Workspace --> Preview
    Workspace --> Chain
    Workspace --> Crop
    Workspace --> Retouch
    Gestures --> Geometry
    Geometry --> Crop
    Preview --> Chain
    Preview --> Photo
    Preview --> Render
    Chain --> Crop
    Chain --> Resample
    Chain --> Retouch
    Chain --> Quantise
    Chain --> Palette
    Retouch --> Background
    Retouch --> Crop
    Background --> Colour
    Kit --> Export
    Kit --> Plan
    Kit --> Bom
    Kit --> BrickLink
    Kit --> Colour
    Quantise --> Palette
    Quantise --> Colour
    Bom --> Palette
    BrickLink --> Bom
    Plan --> Palette
```
## Notes

- `mosaic` holds the shared domain types and size rules; every domain module may import it (arrows
  omitted for legibility). `crop` frames the source, `retouch` works on the stud grid
  ([retouch.md](../../specs/retouch.md)).
- No network egress: there is no API client component. Outputs leave the page only on the user's
  action: the printed plan, the BrickLink XML copied to the clipboard or downloaded as a file.
- The plan is an HTML/CSS grid, not a canvas (spec [kit.md](../../specs/kit.md)): vector print,
  testable in the DOM, light on memory for 8 × 8 plates.
- The purity of `src/domain` is enforced by `tsconfig.domain.json` (no DOM lib) and the ESLint
  import rule set up in brick 1.
