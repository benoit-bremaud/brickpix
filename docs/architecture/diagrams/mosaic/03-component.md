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
        Render["canvas/renderMosaic<br/>(round studs preview, numbered plate grids)"]
        Download["download<br/>(Blob URL)"]
    end

    subgraph domain["src/domain (pure TypeScript)"]
        Retouch["retouch"]
        Resample["resample"]
        Palette["palette<br/>(1 × 1 round tile colours)"]
        Quantise["quantise<br/>(perceptual distance, dithering)"]
        Plan["buildPlan"]
        Bom["billOfMaterials"]
        BrickLink["brickLinkXml"]
    end

    Editor --> ImageIO
    Editor --> Render
    Editor --> Download
    Editor --> Retouch
    Editor --> Resample
    Editor --> Quantise
    Editor --> Plan
    Editor --> Bom
    Editor --> BrickLink
    Quantise --> Palette
    Bom --> Palette
    BrickLink --> Bom
    Plan --> Palette
```

## Notes

- No network egress: there is no API client component. The only output leaving the page is a file
  the user downloads.
- The purity of `src/domain` is enforced by `tsconfig.domain.json` (no DOM lib) and the ESLint
  import rule set up in brick 1.
