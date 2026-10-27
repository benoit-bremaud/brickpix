# Local review — brickpix (issue #8, import, size and live preview)

- Date: 2026-10-27
- Commit: eea8945
- Scope: branch diff main...feat/8-import-size-preview
- Checks run: design · docs · tests · security · correctness
- Verdict: ship — Must 1 · Should 8 · Nice 6, all Must and Should fixed in 9e7a6e0 and later

## Pre-merge gate (head SHA 0f8b970, rerun after the fixes)

| Step | Result |
|---|---|
| 1 Tests | ✅ 53 unit + component (Vitest, domain and web projects) |
| 2 Coverage | tests 100 % stmts / 94.8 % branches / 100 % funcs / 100 % lines (floor 80) · docs 100 % of exported symbols (floor 90) |
| 3 SonarQube | ✅ PASSED (first run failed on 2 new a11y issues in `Editor.tsx`, both fixed) |
| 4 Secrets | ✅ gitleaks clean (main..HEAD) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ pass on the dev server, report `docs/architecture/qa/2026-10-27-preview.md` (import, 3 × 3, 6 × 2 dithered, 8 × 8, console clean, no network egress; after the fixes, a 6000 × 4000 PNG decodes downscaled and previews) |

- Gate: **GREEN on the local gate** — PR CI and reviews still to come

## 🔴 Must Have

- `docs/architecture/diagrams/mosaic/02-sequence-photo-to-kit.md`, `03-component.md` `[design]` · The diagrams diverge from the code: no crop step, `resample` takes a crop, and the `colour` and `crop` modules are missing · Update both diagrams in this PR.

## 🟡 Should Have

- `src/web/canvas/imageIO.ts:5` `[security|correctness]` · A huge photo is decoded at full size (100 MP ≈ 400 MB; Safari has a canvas area limit) · Downscale while decoding to a longest side of 2048 px (above 128 studs × 16), and record it in the spec.
- `src/domain/quantise.ts:21` `[design|correctness]` · `reduce` computes CIEDE2000 twice per comparison · Keep the best distance in a loop.
- `src/domain/quantise.ts:76` `[design]` · Boolean trap on `dithering` · Pass an options object `{ dithering }`.
- `src/domain/image.ts` `[design]` · The module mostly holds mosaic types · Rename it to `mosaic.ts`.
- `src/domain/quantise.ts:76`, `src/web/canvas/imageIO.ts:4` `[docs]` · Missing `@throws` contracts · Add them.
- `src/domain/mosaic.test.ts:126` `[tests]` · Dithering is checked only by "more than one colour" · Add an exact Floyd–Steinberg case and a serpentine row test.
- `src/web/Editor.test.tsx:56` `[tests]` · No check that changes in quick succession collapse into one draw · Add a debounce collapse test.
- `src/web/Editor.test.tsx:128` and `:48` `[tests]` · `computeMosaic` is tested on a uniform photo, and the import test counts `arc` calls · Use a two-tone photo and assert on the `renderMosaic` call.

## 🔵 Nice to Have

- `src/domain/resample.ts:24` `[correctness]` · The last stud reads one pixel past the crop with a weight of about 1e-12 · Clamp the footprint to the crop (cheap, applied).
- `src/web/Editor.tsx:54` `[correctness]` · Two imports can resolve out of order · Add a sequence guard (cheap, applied).
- `src/web/Editor.tsx:30` `[correctness]` · StrictMode makes a second debounced draw, in development only · Left as is.
- `src/domain/quantise.ts:36` `[design]` · `diffuse` takes the whole image · Left as is.
- `src/web/tokens.css` `[design]` · The file also holds layout rules · Left as is.
- `src/domain/mosaic.test.ts` `[tests]` · One file covers five modules · Left as is.

## ⚪ Disagree / Intentional

- `resample.ts:52`, `quantise.ts:77` `[design]` · `assertMosaicSize` is called twice instead of using a branded type · Below the Rule of Three.
- `src/web/Editor.tsx:15` `[design]` · `computeMosaic` lives in the web layer · Matches `03-component.md` (Editor orchestrates the domain).

## Per-dimension summary

- Design: proportionate and the domain stays pure; the diagrams must follow the code.
- Docs: 100 %; three `@throws` notes are missing.
- Tests: trustworthy; dithering exactness and debounce collapse are weak.
- Security: no egress, no XSS; decoding very large photos is unbounded.
- Correctness: CIEDE2000 and serpentine scan verified; two cheap edge-case fixes.
