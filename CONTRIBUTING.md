# Contributing to brickpix

## No conception, no code

Every change to behaviour implements a UML study under `docs/architecture/` that the owner has
validated. If the study is missing, write it first. See [CLAUDE.md](CLAUDE.md).

## Branches and commits

- One issue, one branch from `main`: `<type>/<issue>-<slug>` (e.g. `chore/1-bootstrap`).
- [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`.
- `main` takes no direct commits. A ruleset requires a pull request and the `gate` commit status,
  and blocks force-pushes and deletion (`.github/branch-protection.md`).

## Labels

Every issue and pull request carries one label of each family:

- `type:` feature, bug, docs, chore, research
- `area:` conception, product, image, ui, export, ci, governance, security
- `prio:` P0 (critical) to P3 (low)

## Pull requests

- Fill in the template, link the issue with `Closes #N`, attach the PR to GitHub Project #72.
- Every review comment gets an inline reply before merge. Squash merge only, through
  `just merge <pr>` (it refuses a head without the `gate` attestation; the branch is deleted on
  merge).

## Gates

Local CI (ADR-0001, skill `local-ci`): four tiers, one `just` recipe each, no GitHub workflow runs
on a pull request. Once per clone: `mise trust && mise x -- just setup` (pinned toolchain of `mise.toml`,
dependencies, git hooks).

| Tier | Recipe | When | Holds |
|---|---|---|---|
| L0 | `just fast` | pre-commit hook | staged files: secrets (gitleaks), eslint, shellcheck, actionlint |
| L1 | `just check` | pre-push hook, `review-local --push` | eslint with the dependency rule, tsc, tests with coverage ≥ 80 %, doc coverage ≥ 90 %, the local CI wiring tests, build, Semgrep CE, `pnpm audit` (moderate), gitleaks on the history |
| L2 | `just gate` | on the pushed head, before every merge | L1 + SonarQube quality gate + smoke of the production build + `just rehearse` when `prod.yml` changed, then the signed `gate` attestation on the head SHA |
| L3 | `just nightly` | systemd user timer (`scripts/systemd/`) | L1 + TruffleHog + toolchain drift |

**Pre-push** (every branch, no trivial-diff exception): the hook runs `just check`; the
maintainer's `review-local --push` adds the adversarial review (report in
`docs/architecture/review-local.md`) and resolves every Must Have finding before pushing.

**Pre-merge**: `just gate` green on the pushed head (a branch that changes the gate's own files
needs `GATE_CI_CHANGE=1` after a human read), every review comment answered inline, then
`just merge <pr>`. The QA pass on the running product happens on staging after the merge
(`just deploy staging`), before the release tag.

## Local checks

- `just check`: the L1 tier above (`just lint`, `just test`, `just security`, `just secrets` run
  one part each). `just --list` shows every recipe.
- `just sonar`: scans with the local SonarQube and waits for the quality gate. Needs
  `sonar-scanner` on `PATH` and a token in `~/.config/sonar-tokens/brickpix` (or the global
  analysis token in `~/.config/sonarqube/analysis-token`). Step of `just gate`, needs a fresh
  `coverage/lcov.info` (`just test`).
- `just smoke`: builds and serves `dist/` with `vite preview`, checks the page and its bundle.

## Environments and deployment

Branching model A (agents-skills ADR-0004, applied by ADR-0001): a single `main`, no staging branch. `local` is `pnpm dev`;
`staging` is the Worker version alias `staging` (`staging-brickpix.<subdomain>.workers.dev`),
deployed by `just deploy staging` from an up-to-date, attested `main` (a squash merge creates an
unattested commit: `git checkout main && git pull && just gate` first), then attested after a
successful QA pass by `just attest staging`; `prod` is the Worker deployed by the only GitHub
workflow, `prod.yml`, when a signed stable tag `vX.Y.Z` is pushed: it verifies the tag against
`.github/allowed_signers`, the `gate` status and the staging note with `scripts/attest.sh release`,
then builds and runs `wrangler deploy` (configuration in `wrangler.jsonc`). Fallback when Actions
cannot run: `just deploy prod <tag>` from `main`, logged in `PROJECT_LOG.md`. The workflow needs
the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; release tags are
protected (`.github/tag-protection.md`) and signed (`git tag -s`).

## Logbook

After each merge, add an entry to [PROJECT_LOG.md](PROJECT_LOG.md).
