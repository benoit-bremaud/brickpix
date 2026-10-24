# Local review — brickpix (branch docs/7-palette-spec)

- Date: 2026-10-23
- Scope: branch diff main...HEAD (palette spec, `src/domain/palette.ts` and its tests, doc links)
- Checks run: design · docs · tests (architecture-guardian, covering the three) · security and correctness (manual read: static data, no input, no I/O at runtime)
- Verdict: ship · Must 0 · Should 2 (fixed) · Nice 5 (3 fixed)

## Pre-merge gate
| Step | Result |
|---|---|
| 1 Tests | ✅ 5 unit (Vitest), build ok |
| 2 Coverage | tests 100 % stmts / branches / funcs / lines · docs 100 % (every export documented) |
| 3 SonarQube | ✅ PASSED (local server, re-run on the pushed head) |
| 4 Secrets | ✅ gitleaks clean (main..HEAD) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ smoke only: domain table not rendered yet (first consumer is #8); build passes |
- Gate: **GREEN**

## 🔴 Must Have
_None._

## 🟡 Should Have
- `src/domain/palette.ts` `[design]` · shallow freeze left `rgb` tuples mutable, against the spec · fixed: tuples frozen, test checks it.
- `src/domain/palette.test.ts` `[tests]` · only 2 of 17 rows checked against the spec · fixed: the test parses the spec table and compares every row.

## 🔵 Nice to Have
- Fixed: literal extracted to `COLOURS`; id fields documented; `CLAUDE.md` lists `docs/architecture/specs/`; spec says the LEGO colour id is provenance only.
- Open: `every(...).toBe(true)` assertions do not name the failing row (`palette.test.ts`).

## ⚪ Disagree / Intentional
- `Palette` single-field wrapper and `brickLinkColorId` spelling: both fixed by the validated `04-class.md`.

## Per-dimension summary
- Design: pure, flat static data, matches the class diagram · Docs: complete · Tests: spec drift guard in place · Security: no attack surface · Correctness: all 17 rows verified against the spec by script and by test.
