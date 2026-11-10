# ADR-0001: Run every check locally, keep one GitHub workflow for the production deploy

**Status:** Accepted — 2026-11-10. Issue #53.

Every quality and security check of brickpix runs on the developer's machine and in git hooks;
GitHub Actions keeps a single workflow, `prod.yml`, which promotes a signed stable release tag to
the Cloudflare Worker. Nothing runs on GitHub for a pull request or a push to `main`.

## Context

- The owner decided on 2026-11-07 that on every project all checks run locally and GitHub Actions
  is reserved for a production deploy triggered by a signed release tag (local-first CI/CD, skill
  `local-ci`; agents-skills ADR-0003 attestation, ADR-0004 prod from signed tags, epic
  benoit-bremaud/agents-skills#259). GitHub Actions minutes now bill the account.
- brickpix ran six workflows: `ci.yml` (`pnpm verify`), `codeql.yml`, `dependency-review.yml`,
  `gitleaks.yml`, `scorecard.yml` and `deploy.yml` (Worker deploy on every push to `main`, a
  preview alias per pull request). Every check already had a local or free open-source equivalent;
  the `ci` job took about a minute, CodeQL several.
- `main` was protected by a ruleset requiring the `verify`, `gitleaks` and `sonarqube` statuses,
  the last one posted by a local script after `sonar-scanner`.
- Reference implementations merged the same week: benoit-bremaud/brasse-bouillon#2350 (prod
  workflow kept) and benoit-bremaud/retro-shmup#158 (no workflow, Cloudflare Pages builds `main`
  itself).

## Decision drivers

- Owner rule 2026-11-07: no GitHub-hosted check, review or CI; free open-source tools only.
- The production path must stay verifiable without the laptop: a signed tag, the trusted
  `scripts/attest.sh` of `main`, the `gate` status and the `deploy/staging` note.
- Branching model A (agents-skills ADR-0004): a single `main`; staging is an environment deployed
  from `main`, not a branch.
- Minimal structure: one `justfile`, one `lefthook.yml`, one `mise.toml`, the tiers of the skill.

## Options considered

The fate of `deploy.yml`, scored by MCDA on 2026-11-10 (weights validated by the owner):

| Criterion (weight) | A `prod.yml` on a signed tag + `just deploy` | B no workflow, `just deploy prod <tag>` only | C keep `deploy.yml` on push to `main` |
|---|---|---|---|
| Conformance to the 2026-11-07 rule and ADR-0004 (35) | 5 | 4 | 0 |
| Security of the production path (25) | 5 — verify-tag, `attest.sh` of `main`, `permissions: {}` | 4 — same checks, but the laptop's tokens | 2 — every push deploys, no attestation |
| Actions minutes (20) | 4 — one run per stable release | 5 | 1 |
| Reproducibility and trace (20) | 5 — a GitHub run per tag | 3 — `PROJECT_LOG.md` only | 3 |
| **Total /500** | **475** | 405 | 135 |

Sensitivity: A stays first with the minutes weighted 40 and the conformance 15 (A 445, B 435). B
is a strict subset of A, which keeps `just deploy prod <tag>` as the laptop fallback.

## Outcome

Option A. Concretely:

| Check | Was | Is now |
|---|---|---|
| lint, typecheck, tests with coverage ≥ 80 %, build | `ci.yml` (`pnpm verify`) | `just check` (`lint`, `test`), on pre-push and in `gate` |
| SAST | CodeQL (`codeql.yml`) | Semgrep Community Edition, `p/javascript` + `p/typescript` on `src` (`just security`); the CodeQL CLI licence is limited and the owner's rule is free tools |
| known vulnerabilities in dependencies | `dependency-review.yml`, moderate and above, new dependencies of a pull request only | `pnpm audit --audit-level moderate` on the whole lockfile (`just security`) |
| secrets | `gitleaks-action` | gitleaks CLI: `--staged` on pre-commit, full history in `just secrets` |
| OSSF Scorecard | `scorecard.yml` | dropped: it audits GitHub-side hygiene and runs only on GitHub |
| SonarQube quality gate | `pnpm sonar` + commit status `sonarqube` | `just sonar` in `gate`, quality-gate wait; no separate status |
| doc coverage ≥ 90 % | manual in `review-local` | `scripts/doc-coverage.sh` in `just test` |
| smoke on the production build | none | `scripts/smoke.sh` on `vite preview` in `gate` (browser QA on staging, skill `qa-browser-check`; Playwright: #46) |
| staging | a Worker preview alias per pull request | `just deploy staging` from attested `main`: the Worker version alias `staging` |
| production | `wrangler deploy` on every push to `main` | `prod.yml` on a signed stable tag `vX.Y.Z`: `classify`, then `attest.sh release` of `main` (signature against `.github/allowed_signers`, `gate` status, `deploy/staging` note), then build and `wrangler deploy`; fallback `just deploy prod <tag>` |
| merge | GitHub button, three required statuses | `just merge <pr>` only, after `just gate` on the pushed head; the `main` ruleset requires the `gate` status alone (`.github/branch-protection.md`) |
| release tags | none yet | ruleset on `refs/tags/v*` (`.github/tag-protection.md`), SSH-signed tags |

The tiers (`justfile`): L0 `just fast` on pre-commit (staged secrets, eslint, shellcheck,
actionlint), L1 `just check` on pre-push (lint, test, security, secrets, under three minutes),
L2 `just gate` before every merge (check, Sonar, smoke, `just rehearse` with act when `prod.yml`
changed, then the attestation), L3 `just nightly` on a systemd user timer (check, TruffleHog,
toolchain drift). Tools are pinned in `mise.toml` and `mise.lock`; `just setup` installs them and
the hooks. Dependabot stays, for npm and for the one workflow left.

## Consequences

- A merge no longer deploys. Production moves on a signed tag only, after the staging QA pass has
  been attested (`just attest staging`). The first release will be `v0.1.0`.
- No preview per pull request: a change is seen on staging after its merge, before the tag.
- The Cloudflare secrets stay repository secrets until the owner moves them to a `production`
  environment restricted to `v*` tags (the template's `environment:` line is then restored).
- Semgrep CE has no inter-procedural taint tracking; accepted, the domain has no network input.
- `pnpm audit` audits dev dependencies too: the `minimatch` advisory reached through eslint is
  closed by a pnpm override to the patched major.
- The pipx backend of mise pins the Semgrep version, not its Python dependencies (resolved at
  install time): accepted gap.
- Bootstrap: this change edits the gate itself, so its gate is run with `GATE_CI_CHANGE=1` after a
  human read of the files, and it is merged with `gh pr merge --squash` under the owner's waiver
  (`.github/allowed_signers` is not on `main` before it, so `just merge` cannot verify the note).
  Every later merge goes through `just merge <pr>`.
- A squash merge creates a `main` commit with no attestation: after every merge, `just gate` runs
  again on up-to-date `main` before `just deploy staging` (skill `local-ci` § Attestation).
- Lefthook needs the hooks installed once per clone: `just setup`.
