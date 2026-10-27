# stm Editor

## Context

Lifecycle of the editor in `src/web`. Nothing is persisted: reloading the page returns to `Empty`.

## Diagram

```mermaid
stateDiagram-v2
    [*] --> Empty
    Empty --> Editing : import photo [decoded]
    Empty --> Empty : import photo [decode failed] / show error
    Editing --> Editing : size / retouch / dithering change / refresh preview (debounced)
    Editing --> Editing : import photo [decode failed] / show error, keep current photo
    Editing --> Editing : import photo [decoded] / reset retouch, keep size
    Editing --> PreparingKit : Commander mon kit / show «Préparation du kit…»
    PreparingKit --> KitReady : next frame / recompute the mosaic from the current inputs
    KitReady --> KitReady : spare rate change / update table and XML
    KitReady --> KitReady : print plan / copy or download BrickLink list
    KitReady --> Editing : back to editing
    KitReady --> Editing : import photo [decoded] / reset retouch, keep size
    KitReady --> KitReady : import photo [decode failed] / show error, keep current kit
```

## Notes

- `Editing` always shows the live preview («Aperçu») of the current photo, size and settings.
- A new photo resets the retouch settings but keeps the chosen size (the gift's wall space does not
  change with the photo).
- «Commander mon kit» shows a busy message, lets the browser paint it, then recomputes the
  mosaic from the current photo, size and dithering, so the kit always matches the current inputs, never a stale preview (spec
  [kit.md](../../specs/kit.md)).
- The kit is derived from the current mosaic; going back to editing discards it.
