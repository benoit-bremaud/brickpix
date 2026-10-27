# Local review — brickpix (branch claude/9-kit-0c9a67)

- Date: 2026-10-27
- Commit: 91faceb (review) · 142a7a4 (fixes, re-checked)
- Scope: branch diff origin/main...HEAD (issue #9, kit)
- Checks run: design · docs · tests · security · correctness · QA pass
- Verdict: Must and Should fixed in 142a7a4 · Nice left in #25 · headers in #24 · Must 4 · Should 9 · Nice 9

## Pre-merge gate (head SHA 142a7a4, after fixes)

| Step | Result |
|---|---|
| 1 Tests | ✅ 95 unit / component / integration (vitest) · no E2E suite in the project |
| 2 Coverage | tests 100 % stmts / 93.68 % branches / 100 % funcs / 100 % lines (floor 80) · docs 100 % exported symbols of the changed files (floor 90) ✅ |
| 3 SonarQube | ✅ PASSED on 91faceb · re-run on the pushed head before merge |
| 4 Secrets | ✅ gitleaks clean (origin/main..HEAD, 4 commits) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ pass · Must re-checked on 142a7a4: controls hidden on the kit, focus to the heading then back to «Commander mon kit» · console clean · network localhost + local blob only · SEC-01…10 pass or N/A · domains FON, UI, A11Y, SEC, PRI, PERF · report: docs/architecture/qa/2026-10-27-kit.md |

- Gate: **GREEN on steps 1, 2, 4, 5 — step 3 to confirm on the pushed head**

## 🔴 Must Have

- `src/web/tokens.css:51` + `src/web/Editor.tsx:103` `[correctness][qa]` · `.controls { display: flex }` overrides the `hidden` attribute: the size and dithering inputs stay on the kit screen and print on page 1 · add `[hidden] { display: none !important; }` to tokens.css.
- `docs/architecture/diagrams/mosaic/03-component.md:26,41` `[design]` · `Kit → Colour` dependency (ink uses `relativeLuminance`) missing; Colour box lacks "relative luminance" · add the arrow and the label.
- `docs/architecture/diagrams/mosaic/02-sequence-photo-to-kit.md:34` `[design]` · `computeMosaic` drawn on the Domain lifeline, but it lives in `src/web/Editor.tsx:16` · replace by a note: UI runs the same crop → resample → quantise calls synchronously.
- `src/domain/kit.ts:23`, `src/domain/brickLinkXml.ts:7`, `src/domain/kit.ts:30-31`, `src/web/kit/ink.ts:4`, `docs/architecture/specs/kit.md:64` `[docs][design]` · doc coverage below 90 % (`BillOfMaterials`, `BASE_PLATE_COLOUR_ID`, `SparePercent`, `DEFAULT_SPARE_PERCENT`, `Ink` undocumented) and spec signature `relativeLuminance(rgb)` stale · add the five docstrings, fix the spec to `relativeLuminance(red, green, blue)`.

## 🟡 Should Have

- `src/domain/brickLinkXml.ts:18`, `src/web/kit/BillTable.tsx:10,23` `[design]` · "to buy = quantity + spares" written three times · `tilesToBuy(line)` in `kit.ts`.
- `src/web/kit/BillTable.tsx:20`, `src/web/kit/PlateGrid.tsx:18,24` `[design]` · legend number "index + 1" written three times · `legendNumber(index)` in `kit.ts`.
- `src/web/kit/Kit.tsx:24`, `src/web/Editor.tsx:112` `[qa]` · focus lost on both screen changes (WCAG 2.4.3) · focus the kit heading on open, the order button on back.
- `src/web/kit/Kit.test.tsx:49` `[tests]` · spare change: 5 % and the XML never asserted · `it.each` over Aucune / 5 % checking table and copied XML.
- `src/web/kit/Kit.test.tsx:97` `[tests]` · Blob content and type unchecked · read the blob text.
- `src/web/Editor.test.tsx:188` `[tests]` · dithering forwarded to the kit untested.
- `src/domain/kit.test.ts:22,40` `[tests]` · symmetric fixtures cannot catch an x/y swap inside a plate · asymmetric `(x * 3 + y) % 17`.
- `src/web/kit/Kit.test.tsx:43,69` `[tests]` · assertions pin a leading space from the JSX · trim text; also assert the «Tuiles rondes» footer totals.
- `src/web/Editor.tsx:68-72,103,109` `[docs]` · why `hidden` instead of unmount (keep the preview canvas), and that `order` recomputes synchronously · one comment.
- Out of diff, private `[security][qa]` · no CSP / frame / nosniff headers (no `_headers` for Cloudflare) · owner decision: private advisory or follow-up.

## 🔵 Nice to Have

- `src/web/kit/export.ts:17` `[security][design]` · revoke in the same tick as `click()` may drop downloads in older Safari / Firefox · revoke in `setTimeout(…, 0)`.
- `src/web/kit/Kit.tsx:28` `[correctness]` · `buildPlan` reruns on every spare change · `useMemo` (owner rule: only when profiled; QA measured 16–21 ms, so keep as is).
- `src/web/Editor.tsx:73` `[correctness][design]` · stale kit keeps the old photo in memory until back / next order.
- `src/domain/brickLinkXml.ts:4-7` `[design]` · three constants exported for no caller · make them private.
- `src/web/tokens.css:166-167` `[design]` · `repeat(16, …)` and `gap: 1px` are raw values · tokens.
- `src/web/tokens.css:9-10` `[design]` · ink tokens must stay pure black / white for `inkOn` · comment.
- `src/web/tokens.css:217` `[qa]` · `print-color-adjust: exact` on `*` prints the beige page background · scope it to `.stud, .swatch`.
- Print `[qa]` · printed bill does not say the spare rate · show «Rechange : 2 %» in the caption.
- `src/domain/kit.test.ts`, `src/web/kit/ink.test.ts` `[tests]` · luminance linear branch, exact-integer spare case, 5.2:1 floor pinned.

## ⚪ Disagree / Intentional

- 8 × 8 «Commander mon kit» 304 ms on desktop `[qa]` · accepted by owner decision point 4 (synchronous recompute, 440/500).
- Ink choice in web, luminance in domain · owner decision point 18 (480/500).
- HTML grid plan · owner decision point 3 (445/500).
- Inline `style` background · palette data, not a design token (comment at `Swatch.tsx:3`).
- `BASE_PLATE_COLOUR_ID = 11` literal · the base plate is not a tile colour.
- favicon 404 · predates the diff.

## Per-dimension summary

- Design: pure domain, no over-engineering; two diagrams lag the code; two rules duplicated in web.
- Docs: ≈ 82 % on exported symbols, one stale spec signature.
- Tests: healthy pyramid, no over-mocking; gaps on spare→XML, blob content, dithering, fixtures.
- Security: no injection, no egress, privacy invariant kept; headers gap outside the diff.
- Correctness: `hidden` overridden by CSS (confirmed by QA in the browser).

## Second pass — 406c96e..ffeb1e9 (after the full QA and two Codex reviews)

- Checks run: design · docs · tests · correctness + security (Opus). The full QA pass was already run (`docs/architecture/qa/2026-10-27-kit-full.md`).
- Verdict: Must 3 · Should 9 · Nice 7. All Must and Should are fixed in ffeb1e9; the Nice items are in #30.

| Step | Result on ffeb1e9 |
|---|---|
| 1 Tests | ✅ 97 |
| 2 Coverage | ✅ 100 % lines / 93.81 % branches · docs 100 % exported symbols |
| 3 SonarQube | ✅ PASSED (S6845 suppressed with justification, owner decision MCDA 445) |
| 4 Secrets | ✅ gitleaks clean |
| 5 QA | ✅ full pass, Must PERF-01 resolved (owner decision A, 400), #29 fixed, bill overflow fixed |

- 🔴 Must
  - `specs/kit.md:91` `[docs][design]`: the «Kit trigger» row said «synchronous». **Fixed.**
  - `qa/2026-10-27-kit-full.md:214` `[docs]`: the report claimed a focusable region. **Fixed:** the region is now focusable.
  - `Editor.test.tsx:186` `[tests]`: paint-before-compute was not pinned. **Fixed:** frame and timeout are stepped separately.
- 🟡 Should
  - Spec bullet order and dithering left out of the frozen inputs; scroll region and forced colours missing from the spec. **Fixed.**
  - `PreparingKit` notes in diagram 05. **Fixed.**
  - `useKit` docstring. **Fixed.**
  - Idle and reset assertions; scroll-region test. **Fixed.**
  - WebKit keyboard access to the scroll region `[correctness]`: Tab skips the region without `tabIndex`, tested on WebKit 27.2. **Fixed** with `tabIndex={0}` + `NOSONAR`.
- 🔵 Nice
  - Done here: print `content-visibility: visible`, the import-during-preparation path in diagram 05, the region named by the caption.
  - Filed in #30: the focus drop while preparing, the uncancelled pending order.
- ⚪ Intentional
  - Two booleans rather than a state union.
  - rAF + `setTimeout` rather than a Web Worker, which stays in #28.
