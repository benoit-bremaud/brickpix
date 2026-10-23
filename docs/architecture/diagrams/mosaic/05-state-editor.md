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
    Editing --> KitReady : Commander mon kit
    KitReady --> KitReady : export BrickLink list
    KitReady --> Editing : back to editing
    KitReady --> Editing : import photo [decoded] / reset retouch, keep size
```

## Notes

- `Editing` always shows the live preview («Aperçu») of the current photo, size and settings.
- A new photo resets the retouch settings but keeps the chosen size (the gift's wall space does not
  change with the photo).
- The kit is derived from the current mosaic; going back to editing discards it.
