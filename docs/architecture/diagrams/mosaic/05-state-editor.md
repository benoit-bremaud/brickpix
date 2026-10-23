# stm Editor

## Context

Lifecycle of the editor in `src/web`. Nothing is persisted: reloading the page returns to `Empty`.

## Diagram

```mermaid
stateDiagram-v2
    [*] --> Empty
    Empty --> Retouching : import photo [decoded]
    Empty --> Empty : import photo [decode failed] / show error
    Retouching --> Retouching : adjust / crop
    Retouching --> Previewed : Aperçu
    Previewed --> Retouching : adjust / crop
    Previewed --> Previewed : change size or dithering / re-quantise
    Previewed --> KitReady : Commander mon kit
    KitReady --> KitReady : export BrickLink list
    KitReady --> Previewed : back to preview
    Retouching --> Retouching : import another photo
    Previewed --> Retouching : import another photo
    KitReady --> Retouching : import another photo
```

## Notes

- Importing another photo always restarts retouching from the new source; settings reset.
- The kit is derived from the current mosaic; going back invalidates it.
