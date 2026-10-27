# Local review — brickpix (chore/37-remove-lego-trademark)

Local pre-push review of the trademark removal (#37). It lists the reconciled findings and what was fixed.

- Date: 2026-10-28
- Commit: f7a9f8e (reviewed), with the fixes in 331af72
- Scope: branch diff `origin/main...HEAD`
- Checks run: design · docs · tests · security · correctness
- Verdict: ship as-is after the fixes · Must 0 · Should 4 (fixed) · Nice 1 (fixed)

## Pre-merge gate (head SHA 331af72)

| Step | Result |
|---|---|
| 1 Tests | ✅ 156 unit/integration (`pnpm verify`) |
| 2 Coverage | tests 98.91 % stmts / 88.53 % branches / 100 % funcs / 100 % lines (floor 80) · docs: no new public API |
| 3 SonarQube | run after push on a clean tree (`pnpm sonar`) |
| 4 Secrets | ✅ gitleaks clean (`origin/main..HEAD`) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ smoke (copy-only UI change) · tagline reads «mosaïque de briques» · console clean · screenshot: `qa/2026-10-28-brand-smoke-01-tagline.jpg` |

- Gate: **GREEN pending SonarQube**

## 🔴 Must Have

_None._

## 🟡 Should Have

- `src/domain/palette.test.ts:12` `[design|tests]` · element-id uniqueness and format were no longer checked once the field left the domain type · fixed: the spec-row test checks the spec column.
- `docs/architecture/specs/palette-round-tiles.md:86` `[docs|design]` · the invariant claimed an unenforced check · fixed: points to the spec-row test.
- `docs/architecture/specs/palette-round-tiles.md:26,32` `[docs]` · ragged wrap after rewording · fixed.
- `docs/architecture/specs/palette-round-tiles.md:80` `[docs]` · «Pick a Brick» is a brand-owned service name · fixed: «the manufacturer's own webshop».

## 🔵 Nice to Have

- `docs/architecture/specs/palette-round-tiles.md:26` `[docs]` · the Beatles set lost its identifier · fixed: set number 31198 cited.

## ⚪ Disagree / Intentional

- `README.md:39` `[docs]` · the non-affiliation notice names the trademark on purpose · owner decision, point 2.
- `docs/product/vision.md:34`, `PROJECT_LOG.md` `[docs]` · third-party repository names and dated log entries stay · owner decision, point 4.

## Per-dimension summary

- Design: field removal is a YAGNI gain; code matches `04-class.md`. · Docs: consistent, one intended mention left. · Tests: spec-row test still strict. · Security: nothing. · Correctness: nothing.
