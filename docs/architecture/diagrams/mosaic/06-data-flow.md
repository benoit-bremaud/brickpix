# Data flow — pixels in, tiles and lists out

## Context

What data flows where, and which of it is sensitive. The photo is personal data (faces, places):
it and every image derived from it stay in browser memory.

## Diagram

```mermaid
flowchart LR
    File[/"Photo file 🔒 PII"/] -- "PII: photo pixels" --> Decode["Decode"]
    Decode --> Src[("Source RgbaImage 🔒<br/>memory only")]
    Src -- "PII: photo pixels" --> Retouch["Retouch"]
    Settings[/"Retouch settings"/] --> Retouch
    Retouch --> Ret[("Retouched image 🔒")]
    Ret --> Resample["Resample to studs"]
    Size[/"Mosaic size"/] --> Resample
    Size -- "crop ratio" --> Retouch
    Resample --> Quantise["Quantise"]
    Pal[("Palette (static)")] --> Quantise
    Dither[/"Dithering on/off"/] --> Quantise
    Quantise -- "PII: low-res likeness" --> Mosaic[("Mosaic 🔒<br/>palette indices")]
    Mosaic --> Plan["Build plan per plate"] --> PlanOut[/"Plan on screen"/]
    PlanOut -- "PII: likeness, user-directed print" --> Print[/"Printer / OS print dialog"/]
    Mosaic --> Bom["Bill of materials"] --> BomOut[/"Counts per colour, base plates"/]
    Bom --> Xml["BrickLink XML"] --> Dl[/"Downloaded file (user's disk)"/]

    subgraph Browser["Browser — trust boundary"]
        File
        Settings
        Size
        Dither
        PlanOut
        BomOut
        Decode
        Src
        Retouch
        Ret
        Resample
        Quantise
        Mosaic
        Plan
        Bom
        Xml
        Pal
    end
```

## Notes

- 🔒 and `PII:` edges mark data derived from the photo. None of it crosses the browser boundary except the printed plan below:
  no upload, no storage, no analytics on image content.
- Printing the plan is the one user-directed egress of photo-derived data (the plan pictures the
  mosaic): it goes to the OS print dialog, outside the browser boundary, only on the user's action.
- The BrickLink XML holds only part ids, colour ids and quantities; it leaves the browser only as
  a file the user chooses to download.
- The mosaic itself is a low-resolution rendition of the photo; it is treated as sensitive too.
