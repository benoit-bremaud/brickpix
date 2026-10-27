# QA smoke — retouch brick after review fixes (2026-10-27)

| Level | Head SHA | Environment | Targets | Agent / model |
|---|---|---|---|---|
| smoke | 3744ba2 | local (http://localhost:5173, Vite dev) | W | qa-tester · Sonnet |

Gate ✅ · 🔴 Must 0 · 🟡 Should 0 · 🔵 Nice 1 — 9 checks: Pass 9. Previous full pass: `2026-10-27-retouch.md`.

| Check | Verdict | Evidence | Shot |
|---|---|---|---|
| Import (PNG injected on the file input) | PASS | mosaic renders, "3 × 3 plaques · 48 × 48 tenons · 2 304 tuiles" | |
| Toolbar is a `<fieldset>` with legend "Retouche" | PASS | legend text read in the DOM; 3 buttons with `aria-pressed`, one active at a time | |
| Cadrer | PASS | width/height steppers, Zoom, Pivoter, Miroir, Recentrer shown | |
| Ambiance | PASS | Auto/Naturel/Pop/Doux/N&B; Pop changes the canvas; Plus shows Luminosité, Contraste, Saturation, Netteté (-100..100, Netteté 0..100) | 01 |
| Fond | PASS | "Fond uni" switch on, Tolérance range (10) | |
| Before view: long press and Space | PASS | `data-view` mosaic → before on press/Space down, back to mosaic on release; pointercancel also returns to mosaic | |
| Order button and kit | PASS | kit view with print, BrickLink copy/download, spare-parts, part list; "Retour à l'édition" returns | |
| Keyboard focus on toolbar | PASS | Tab lands on Ambiance, `:focus-visible` true, auto outline 1px orange | 01 |
| 375 px layout | PASS | scrollWidth 360 ≤ 375, tool buttons 44 px high | 01 |
| Console | PASS | built-in pane: only Vite/React dev messages; Playwright reload: 1 error (below) | |

## Findings
1. 🔵 Nice — `/favicon.ico` returns 404 (console error on every load). Suggested fix: add a favicon or `<link rel="icon" href="data:,">`. Not checked against #38; no issue filed.

## Not tested
Pinch-then-one-finger pan and brightness-before-contrast clamp: no touch hardware or pixel oracle in a smoke pass (covered by unit tests). Dev server only, not the production build.
