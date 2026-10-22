# Local review — brickpix (brick 1 bootstrap)

- Date: 2026-10-23
- Commit: b555441 (reviewed), fixes applied on top before the push
- Scope: whole tree (first commit, no `origin/main` yet), branch `chore/1-bootstrap`
- Checks run: design · docs · tests · security · correctness
- Verdict: fix Must Have first (done) · Must 4 · Should 14 · Nice 12

## Pre-merge gate (head SHA: the fix-up commit after b555441)
| Step | Result |
|---|---|
| 1 Tests | ✅ 1 unit (web project) · domain project has no file yet by design · no E2E suite yet |
| 2 Coverage | tests 100 % stmts / 100 % branches / 100 % funcs / 100 % lines (floor 80) · docs 100 % (1/1 exported symbol, hand count, floor 90) |
| 3 SonarQube | ✅ PASSED on b555441 (local server, project `brickpix`), re-run on the fix-up SHA after push via `pnpm sonar` |
| 4 Secrets | ✅ gitleaks clean (`--log-opts=--all` and working tree) · no tracked .env · diff read: nothing sensitive (project node id and account e-mail are not secrets) |
| 5 QA pass | ✅ smoke (tooling diff): dev server on :5173, shell renders, console clean (Vite + React DevTools info only), network 200 only · screenshot `docs/architecture/qa/2026-10-23-smoke-shell.jpg` |
- Gate: **GREEN for the push**. Merge waits for CI on the pull request and the SonarQube status on the pushed SHA.

## 🔴 Must Have
- `eslint.config.js:38-44` `[design|tests]` · the domain purity rule also matched `src/domain/**/*.test.ts`, so the first domain test (`import ... from "vitest"`) would fail `pnpm verify` · **fixed**: tests ignored by the rule; probe confirmed (vitest import in a domain test lints clean).
- `CONTRIBUTING.md:12-13,26` `[docs]` · claimed a ruleset and squash-only merges that did not exist · **fixed**: squash-only and delete-branch-on-merge set in the repository settings; the ruleset is worded as "enabled right after the first push" and is created once `main` exists.
- `SECURITY.md:9-11` `[docs]` · pointed to private vulnerability reporting while it was disabled · **fixed**: enabled on the repository.
- GitHub issue #1 title `[docs]` · said "Cloudflare Pages" · **fixed**: renamed to Workers static assets.

## 🟡 Should Have
- `eslint.config.js:42` + `tsconfig.json:4,16` `[design]` · the purity guard was a blacklist of four globals; `ImageData`, `fetch`, `localStorage` passed · **fixed**: `tsconfig.domain.json` (no DOM lib, no types) run by `pnpm typecheck`; probe confirmed `ImageData` is rejected.
- `eslint.config.js:39,34` `[design]` · domain and react-hooks rules covered only one extension · **fixed**: `{ts,tsx}` on both.
- `eslint.config.js:22` `[design]` · no early smell detection · **fixed**: `complexity`, `max-depth`, `max-params`, `max-lines-per-function`.
- `vite.config.ts:17` `[tests]` · `src/web/*.test.ts` files were silently skipped · **fixed**: `*.test.{ts,tsx}`.
- `src/web/test-setup.ts` `[tests]` · no Testing Library cleanup (globals off) · **fixed**: `afterEach(cleanup)`.
- `vite.config.ts` `[tests]` · no `restoreMocks` / `unstubGlobals` / `unstubEnvs` · **fixed**.
- `sonar-project.properties:6` vs `vite.config.ts:25` `[design|correctness]` · coverage exclusions differed · **fixed**: `sonar.coverage.exclusions`.
- `.github/workflows/deploy.yml:31` `[design]` · production deployed after `pnpm build` only, in parallel with CI · **fixed**: runs `pnpm verify`.
- `.github/workflows/deploy.yml` `[correctness|design]` · no `concurrency` group · **fixed** (cancel in progress on PRs only).
- `.github/workflows/deploy.yml:20` `[security|docs]` · Dependabot PRs cannot read the secrets and would fail · **fixed**: actor guard and comment.
- `.github/workflows/gitleaks.yml` `[security]` · `pull-requests: write` at workflow level, checkout kept credentials · **fixed**: job-level permission, `persist-credentials: false`.
- `.github/workflows/deploy.yml:40-46` `[security]` · production without a GitHub Environment · **deferred**: on a public Free repo required reviewers exist; to set up with the Cloudflare secrets (owner action, logged as pending in `PROJECT_LOG.md`).
- `CONTRIBUTING.md:48`, `.github/pull_request_template.md:10,16` `[docs]` · preview alias not described, "traceability matrix" not planned, gate name inconsistent · **fixed**.
- `vite.config.ts:27` `[tests]` · uniform 80 % threshold may let a weak web file mask the domain · **deferred** to the first domain brick (per-glob thresholds for `src/domain/**`).

## 🔵 Nice to Have
- `vite.config.ts:4` `[design]` · dead named export next to the default export · **fixed** (default export only).
- `package.json:20` `[design]` · local `deploy` script bypassed the gate · **fixed** (removed).
- `package.json:19` `[design]` · `sonar` failed silently on a dirty tree · **fixed** (message).
- `package.json:18` `[design]` · `verify` ran `tsc` twice · **fixed** (`vite build`).
- `wrangler.jsonc:5-7` `[design]` · `observability` on an assets-only site · **fixed** (removed).
- `src/web/App.tsx:6` vs `index.html:2` `[design|correctness]` · English text under `lang="fr"` · **fixed** (French placeholder, product UI is French).
- `.github/dependabot.yml` `[security]` · no cooldown · **fixed** (3 days).
- `README.md:23` `[docs]` · prerequisites missing · **fixed**.
- `.github/workflows/dependency-review.yml:16` `[security]` · licence allow-list · open, decide when the first dependency with an unusual licence appears.
- `.github/workflows/scorecard.yml:10` `[security]` · `permissions: read-all` at top level (upstream template) · open.
- `wrangler.jsonc` `[security]` · no security headers (`public/_headers`: CSP, nosniff, referrer policy) · open, before the first real production use (brick with the editor).
- `scripts/sonar-status.sh:13` `[security]` · no readability check on the token file · open.

## ⚪ Disagree / Intentional
- Domain Vitest project and domain lint block before any domain code `[design]` · enforces an invariant declared in `CLAUDE.md`, near-zero cost.
- `src/web/App.tsx` placeholder without a UML study `[design]` · no behaviour, exists to run build, test, coverage and deploy end to end; brick 2 replaces it.
- Setup steps repeated in `ci.yml` and `deploy.yml` `[design]` · two occurrences, no composite action yet (rule of three).
- Caret ranges in `package.json` `[security]` · lockfile committed, frozen installs.

## Per-dimension summary
- Design: tooling proportionate, no over-engineering; the purity guard is now compiler-enforced · Docs: 100 % presence, four stale claims about repository settings fixed at the source · Tests: one proportionate smoke test, setup hardened for the coming Canvas boundary · Security: actions pinned, least privilege, secrets scoped to the deploy steps, no secret in the tree · Correctness: `pnpm verify` green, no bug found; deploy concurrency and gate ordering fixed.

## Addendum 2026-10-23 — PR #2 review round (Codex)

- Scope: `package.json`, `README.md` (two Codex P2 findings on 94b321b). Checks run: design · docs · tests · security · correctness, `pnpm verify` green (coverage 100 %), gitleaks clean on full history.
- Must: _None._
- Should (applied): `package.json:20` `[correctness]` · `pnpm sonar` must also fail when only `scripts/sonar-status.sh` fails · `scripts/sonar-status.sh || rc=1`.
- Nice (applied): `README.md:25` `[docs]` · state the exact Node range (22.22.2+, 24.15+ or 26+) rather than "22.22.2 or later".
- Nice (not applied): `.github/workflows/*.yml` `node-version: 22` resolves to the latest 22.x, inside the range; pinning is not needed.
- Codex round 3 (applied): `eslint.config.js` `[design]` · relative imports could climb out of `src/domain` · one config per nesting depth caps `../` at the directory level, probed with escaping, internal and package imports (all three outcomes as expected).
