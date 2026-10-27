# Local review — brickpix (feat/10-retouch-before-quantisation)

Local pre-push review of the retouch brick (#10). It lists the reconciled findings and what was fixed.

- Date: 2026-10-27
- Commit: e762e97 (reviewed), with the fixes in the next commit
- Scope: branch diff `origin/main...HEAD`
- Checks run: design · docs · tests · security · correctness
- Verdict: fix Must Have first (done) · Must 2 · Should 7 · Nice 6

## Pre-merge gate (head SHA after the fix commit)

| Step | Result |
|---|---|
| 1 Tests | ✅ 152 unit/integration (Vitest, domain + web) · no E2E suite in the project |
| 2 Coverage | tests 98.9 % stmts / 88.2 % branches / 100 % funcs / 100 % lines (floor 80) · docs ≈ 90 % after the added docstrings (estimate, floor 90) |
| 3 SonarQube | ⚠️ not run yet: runs after the push |
| 4 Secrets | ✅ gitleaks clean (`origin/main..HEAD`, 5 commits) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ pass · desktop and 375 px · no console errors · report: docs/architecture/qa/2026-10-27-retouch.md |

- Gate: **RED: SonarQube pending** (re-check after push)

## 🔴 Must Have

- `docs/architecture/diagrams/mosaic/03-component.md` `[design]` · the diagram drifted from the code: a wrong `Retouch → Colour` arrow, and `background`, `chain`, `usePreview`, `Workspace`, `useFrameGestures`, `frameGeometry` and `renderPhoto` were missing · **fixed**: diagram redrawn from the imports.
- `src/domain/background.ts:18` `[docs|correctness]` · the bottom corners were seeded, contrary to the doc and the spec · **fixed**: the side columns stop above the bottom row; a test fails on the old code.

## 🟡 Should Have

- `src/web/retouch/useFrameGestures.ts:98` `[correctness]` · «before» stayed on when «Cadrer» opened during a long press or while Space was held · **fixed**, with a regression test.
- `src/web/retouch/useFrameGestures.ts:98` `[correctness]` · the finger left after a pinch stopped panning · **fixed**, with a regression test.
- `src/web/retouch/Workspace.test.tsx` `[tests]` · slider tests only echoed the input value · **fixed**: a test checks that the background setting reaches `computeMosaic`.
- `src/domain/retouch.test.ts` `[tests]` · the background had no edge cases and a weak gradient assertion · **fixed**: added 1 × 6, 6 × 1 and bottom-corner cases.
- `src/domain/retouch.ts:19`, `src/domain/background.ts:13`, `src/web/usePreview.ts` `[docs]` · missing docs on `NEUTRAL_RETOUCH`, `BACKGROUND_TOLERANCE` and the `usePreview` contract · **fixed**.
- `crop.ts`, `retouch.ts`, `frameGeometry.ts`, `FramePanel.tsx:5` `[design]` · the clamp is written four times · deferred to #38.
- `Workspace.tsx:45`, `FramePanel.tsx:10`, `TonePanel.tsx:5` `[design]` · more than one component per file; `FrameTarget.framing`/`settings` naming · deferred to #38.

## 🔵 Nice to Have

- `useFrameGestures.ts` `[correctness]` · the long-press timer outlived unmount · **fixed** in the effect cleanup.
- `src/domain/crop.ts:57` `[correctness]` · `cropFor` returns a negative crop on a 0 × 0 image (import never produces one) · #38.
- `src/domain/background.ts:84` `[correctness]` · the border count is O(border²) · #38.
- `src/domain/retouch.ts:32` `[design]` · French mood labels live in the domain · #38.
- `Workspace.test.tsx` `[tests]` · the keyboard test chains several gestures · left as is.
- `retouch.test.ts` `[tests]` · the MOODS test restates the constant · left as is.

## ⚪ Disagree / Intentional

- `src/web/Editor.tsx:81` `[design]` · the Workspace is remounted by `key` while size and dithering stay above it · spec retouch.md: a new photo resets the retouch and keeps the size.
- `src/web/canvas/renderPhoto.ts:9` `[design]` · the module-level `WeakMap` cache is keyed on immutable images.

## Per-dimension summary

- Design: layering correct, no over-engineering; the diagram drift is fixed, and the duplication goes to #38.
- Docs: one stale statement fixed and three gaps filled.
- Tests: the pyramid is healthy and no domain logic is mocked; wiring and edge tests were added.
- Security: no network egress, no unsafe DOM; the photo stays in the browser.
- Correctness: two gesture bugs and a timer leak fixed.
