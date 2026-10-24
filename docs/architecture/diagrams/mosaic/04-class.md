# cd Mosaic domain

## Context

Domain types of `src/domain`. Plain data plus pure functions; no classes are required at
implementation, the diagram states the shapes and relations.

## Diagram

```mermaid
classDiagram
    class RgbaImage {
        +width: number
        +height: number
        +data: Uint8ClampedArray
    }
    class RetouchSettings {
        +crop: Rect
        +brightness: number
        +contrast: number
        +saturation: number
        +sharpen: number
        +simplifyBackground: boolean
    }
    class Rect {
        +x: number
        +y: number
        +width: number
        +height: number
    }
    class PaletteColour {
        +id: string
        +name: string
        +rgb: [number, number, number]
        +brickLinkColorId: number
        +legoElementId: string
    }
    class Palette {
        +colours: PaletteColour[]
    }
    class MosaicSize {
        +platesWide: number
        +platesHigh: number
    }
    class Mosaic {
        +size: MosaicSize
        +palette: Palette
        +cells: Uint8Array
    }
    class PlatePlan {
        +column: number
        +row: number
        +cells: Uint8Array
        +legend: PaletteColour[]
    }
    class BillOfMaterials {
        +tiles: TileLine[]
        +basePlates: number
    }
    class TileLine {
        +colour: PaletteColour
        +quantity: number
    }

    RetouchSettings *-- Rect
    Palette *-- "1..*" PaletteColour
    Mosaic *-- MosaicSize
    Mosaic --> Palette
    Mosaic ..> PlatePlan : buildPlan()
    Mosaic ..> BillOfMaterials : billOfMaterials()
    BillOfMaterials *-- "1..*" TileLine
    TileLine --> PaletteColour
    PlatePlan --> "1..*" PaletteColour : legend
```

## Notes

- `MosaicSize` counts base plates; studs are `16 × plates`. Both counts are integers ≥ 1.
- `Mosaic.cells` holds one palette index per stud, row-major (`studsWide × studsHigh`).
- `RetouchSettings.crop` keeps the `platesWide:platesHigh` ratio of the current size.
- `PlatePlan.cells` is the 16 × 16 slice of one plate; plates are numbered row-major from the top
  left, which is the build order. `legend` lists the colours used on that plate, in palette order;
  the plan grid prints each stud's legend number.
- `BillOfMaterials.basePlates = platesWide × platesHigh`; tile quantities are exact counts (spares
  are the buyer's choice, not added silently).
- The palette is a static data table in the domain; exact colour values live in
  [the palette spec](../../specs/palette-round-tiles.md), not this diagram.
