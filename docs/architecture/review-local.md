# Local review — brickpix (chore/11-custom-domain)

Local pre-push review of the custom domain change (#11). It lists the reconciled findings and what was fixed.

- Date: 2026-10-28
- Commit: working tree on top of cd9dfc7 (reviewed), fixes in the first commit of the branch
- Scope: branch diff `origin/main...HEAD` (config and docs only, no TypeScript)
- Checks run: design · docs · security · correctness (tests: no code changed)
- Verdict: ship after the fixes · Must 2 (fixed) · Should 6 (fixed) · Nice 2 (1 fixed, 1 disagree)

## Pre-merge gate (pre-push, before the merge run)

| Step | Result |
|---|---|
| 1 Tests | ✅ 156 unit/integration passed (`pnpm verify`) · `wrangler deploy --dry-run` reads the config |
| 2 Coverage | tests 98.91 % stmts / 88.53 % branches / 100 % funcs / 100 % lines (floor 80) · docs n/a (no code) |
| 3 SonarQube | pending: `pnpm sonar` after push on a clean tree |
| 4 Secrets | ✅ gitleaks clean (full history) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | pending: smoke on the PR preview, then on the custom domain after the deploy |
- Gate: **pre-push green**, merge waits on steps 3 and 5

## 🔴 Must Have
- `README.md:11` `[docs]` · Status said "no image logic yet", contradicting the new "Live at" line · rewritten (fixed)
- `docs/architecture/diagrams/deployment/01-deployment.md:7` `[docs]` · owner validation claim · true: the owner approved the plan with this diagram on 2026-10-28

## 🟡 Should Have
- `.github/workflows/deploy.yml:5` `[security|correctness]` · custom domain needs Zone Read as well as Workers Routes Edit · comment and diagram note updated (fixed); the owner sets it on the token
- `01-deployment.md` `[docs]` · loose UML (URLs drawn as nodes) · hosts are now communication paths, Mermaid limit stated (fixed)
- `01-deployment.md` `[security]` · public preview URLs not recorded as accepted · noted (fixed)
- `01-deployment.md` `[docs]` · old workers.dev production URL stops working · noted (fixed)
- `deploy.yml:6`, `README.md:40` `[docs]` · lines over 100 columns · rewrapped (fixed)
- `CLAUDE.md` `[docs]` · visibility decision under Status · moved to Project invariants (fixed)

## 🔵 Nice to Have
- `wrangler.jsonc:16` `[docs]` · cite the preview default rule · comment kept short; the rule is in the diagram notes (fixed)

## ⚪ Disagree / Intentional
- `deploy.yml` `[security]` · separate preview token without zone rights · YAGNI: one token on one zone, owner decision (point 1, 2026-10-28)

## Per-dimension summary
- Design: minimal change, no over-engineering · Docs: Status and diagram fixed · Tests: no code changed ·
  Security: no secret, token scope documented · Correctness: config valid for wrangler 4.151, previews unaffected
