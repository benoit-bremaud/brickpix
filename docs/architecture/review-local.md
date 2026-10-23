# Local review — brickpix (branch docs/5-uml-study)

- Date: 2026-10-23
- Commit: e133709 + review fixes (same branch)
- Scope: branch diff main...HEAD (docs only: UML study `diagrams/mosaic/`, READMEs, vision)
- Checks run: design (architecture-guardian, UML conformance) · docs · tests · security · correctness
- Verdict: ship after fixes · Must 2 (fixed) · Should 7 (fixed) · Nice 6 (5 fixed, 1 kept)

## Pre-merge gate (head SHA e133709)
| Step | Result |
|---|---|
| 1 Tests | ✅ 1/1 unit (no code change) |
| 2 Coverage | tests 100 % stmts / 100 % branches / 100 % funcs / 100 % lines (floor 80) · docs 100 % (one exported symbol, unchanged) |
| 3 SonarQube | ✅ PASSED |
| 4 Secrets | ✅ gitleaks clean (`--all`) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ smoke only (docs diff): `pnpm verify` build green; every Mermaid block renders with mermaid-cli 11.4.0 |
- Gate: **GREEN — merge authorised**

## 🔴 Must Have
- `diagrams/mosaic/02-sequence-photo-to-kit.md` `[design]` · crop ratio depended on a size chosen later · size now drives the crop; size change re-runs the whole chain. Fixed.
- `diagrams/mosaic/01-use-case.md` `[design|docs]` · sharpen, frame, plan legend dropped silently · owner 2026-10-23: sharpen and legend modelled, frame after V1 (vision updated). Fixed.

## 🟡 Should Have
- `01-use-case.md` `[design]` · «include» of size and extend-only Retouch · size is its own goal, adjustments listed in Notes. Fixed.
- `01-use-case.md` `[docs]` · French use-case names · English names, French UI labels in a note. Fixed.
- `05-state-editor.md` `[design]` · explicit Aperçu vs live preview · owner chose live (debounced); `Editing` state. Fixed.
- `02-sequence-photo-to-kit.md` `[correctness]` · `quantise` lacked the size · signature takes `MosaicSize`. Fixed.
- `docs/architecture/README.md`, `README.md` `[docs]` · state names, background step, minimum size · aligned. Fixed.
- `02-sequence-photo-to-kit.md` `[design]` · algorithms unnamed · V1 defaults listed in Notes. Fixed.

## 🔵 Nice to Have
- `06-data-flow.md` `[security]` · `PII:` edge labels, inputs inside the boundary, dithering input. Fixed.
- `04-class.md` `[design]` · methods on plain data removed. Fixed.
- `05-state-editor.md` `[design]` · failed decode while editing, size kept on new photo. Fixed.
- `03-component.md` `[design]` · mosaic/plan renderer added. Fixed.
- `02-sequence-photo-to-kit.md` `[correctness]` · resample return. Fixed.
- `02-sequence-photo-to-kit.md` `[design]` · retouch performance at full resolution: kept under the deferred Web Worker note (measure first).

## ⚪ Disagree / Intentional
- `03-component.md` `[design]` · Editor calls domain functions directly, no ports · flat by design (architecture skill, YAGNI).
- `04-class.md` `[design]` · plain types, no classes · intentional.

## Per-dimension summary
- Design: invariants kept (pure domain, no egress); modelling consistency fixed · Docs: vision, READMEs and study aligned · Tests: no code · Security: no egress, PII flagged · Correctness: signatures consistent across diagrams.
