# Contributing to brickpix

## No conception, no code

Every change to behaviour implements a UML study under `docs/architecture/` that the owner has
validated. If the study is missing, write it first. See [CLAUDE.md](CLAUDE.md).

## Branches and commits

- One issue, one branch from `main`: `<type>/<issue>-<slug>` (e.g. `chore/1-bootstrap`).
- [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`.
- `main` takes no direct commits: a ruleset requires a pull request and green checks, and blocks
  force-pushes and deletion.

## Labels

Every issue and pull request carries one label of each family:

- `type:` feature, bug, docs, chore, research
- `area:` conception, product, image, ui, export, ci, governance, security
- `prio:` P0 (critical) to P3 (low)

## Pull requests

- Fill in the template, link the issue with `Closes #N`, attach the PR to GitHub Project #72.
- Every review comment gets an inline reply before merge. Squash merge only.

## Gates

**Pre-push** (every branch, no trivial-diff exception): run the local review gate (design, docs,
tests, security and correctness review plus a secrets scan) and resolve every Must Have finding
before pushing.

**Pre-merge** (on the merged SHA): test suites, coverage ≥ 80 % and documentation coverage ≥ 90 %,
SonarQube quality gate, secrets scan and a manual diff read, QA pass on the running product with
screenshots. All green, or no merge.

## Local checks

- `pnpm verify`: lint (with the dependency rule), type check, tests with coverage, build. The same
  runs on GitHub as the `verify` check.
- `pnpm sonar`, after pushing the branch: scans with the local SonarQube and posts the quality gate
  as the commit status `sonarqube`. Needs the global analysis token in `SONAR_TOKEN` and a
  SonarQube user token in `~/.config/sonarqube/token`.

## Environments and deployment

GitOps, static profile: `local` is `pnpm dev`; `staging` is the Cloudflare Workers preview URL
that every pull request gets (`wrangler versions upload`); `prod` is the Worker deployed from
`main` (`wrangler deploy`, configuration in `wrangler.jsonc`). The `deploy` workflow needs the
repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Logbook

After each merge, add an entry to [PROJECT_LOG.md](PROJECT_LOG.md).
