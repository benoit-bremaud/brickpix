# Local review — brickpix (ci/53-local-ci-prod-only)

Local pre-push review of the local CI migration (#53, ADR-0001). It lists the reconciled findings of
the six dimensions and what was fixed before the push.

- Date: 2026-11-10
- Commit: 1739d10 (reviewed), with the fixes in the next commit of the branch
- Scope: branch diff `main...HEAD` (35 files: workflows removed, `prod.yml`, `justfile`,
  `lefthook.yml`, `mise.toml`, `scripts/`, ADR-0001, docs)
- Checks run: adversarial (Opus, 2 rounds) · design · docs · tests · security · correctness
- Verdict: fix Must Have first (done) · Must 5 · Should 13 · Nice 11

## Adversarial review (#236)

- Round 1 on `1739d10`: Must 2 · Should 9 · Nice 9 · unverified 2 · Push gate: closed
- Round 2 on the fix commit: see the line below, filled by § 3b
- Optional second review (owner's OpenAI account): ChatGPT/Codex not run (never a gate step)

## Pre-merge gate (head SHA 1739d10, `--push` mode)

| Step | Result |
|---|---|
| 0 CI mirror | n/a — no workflow triggered on `pull_request` (only `prod.yml`, on `v*` tags) |
| 1 Tests | ✅ 156 unit/integration (13 files) · ✅ 103 → 105 local CI wiring cases · ✅ 28 → 39 attestation cases |
| 2 Coverage | tests 98.91 % stmts / 88.53 % branches / 100 % funcs / 100 % lines (floor 80) · docs 94/94 exports, 100 % (floor 90) |
| 3 SonarQube | ✅ PASSED (`just sonar`, project `brickpix`, run now as a cheap scan) |
| 4 Secrets | ✅ gitleaks clean (`main..HEAD` and full history in `just secrets`) · no tracked .env · diff read: a public key and a noreply address only |
| 5 E2E/smoke | ✅ `just smoke` serves the production build · ⏸ QA pass on staging after the merge |
- Gate: **pre-push green** — `mise x -- just check` passed on 1739d10 and on the fix commit; the
  attestation (`just gate`) is deferred to the pushed head (never GREEN here).

## 🔴 Must Have

- `sonar-project.properties:10` `[adversarial|docs]` · stale comment naming `pnpm sonar` and
  `scripts/sonar-status.sh`, both deleted · fixed: comment now names `just sonar`.
- `wrangler.jsonc:11` `[adversarial]` · stale comment: "pull-request preview (= staging)" while
  staging is now the `staging` version alias · fixed.
- `scripts/test-attest.sh:84` `[tests|adversarial]` · the `write gate <commit>` guards
  (`attest.sh:49-52`: empty capture, unknown commit, moved HEAD) had no case; the gate tests stub
  `attest.sh` · fixed: three cases added.
- `scripts/test-local-ci.sh:52` `[tests|design]` · `doc-coverage.sh` was only grepped from the
  `test` recipe, its floor and exclusions untested · fixed: throwaway repo, 9/10 passes at 90.0 %,
  9/11 fails, companion `type` and re-export lines not counted, a root `src/` file seen, no export
  refused.
- `.github/workflows/prod.yml:20` `[security]` · the signature check lives in the workflow a tag
  executes: without the tag ruleset, anyone with push access could push a `v*` tag whose
  `prod.yml` reads the repository secrets · fixed on GitHub: ruleset `release tags` (id 26949817)
  created on `refs/tags/v*`; the move of the Cloudflare secrets to a `production` environment
  stays an owner follow-up (ADR-0001 § Consequences).
- `scripts/attest.sh`, `scripts/test-attest.sh` `[design]` · copies drifting from
  `~/.claude/scripts` in both directions (the option guard and the tag regex here, the
  concurrent-push test upstream only) · fixed here: the agents-skills #372 case is ported (39
  cases); the two hardenings go upstream through an agents-skills issue.

## 🟡 Should Have

- `.github/workflows/prod.yml:73` `[security|adversarial]` · the Cloudflare secrets were in the env
  of `pnpm install` and `vite build` · fixed: a `Build` step without secrets, then `Deploy
  production` with them.
- `scripts/attest.sh:109` `[security]` · a signed tag object re-pushed under another name verified
  (rollback to an old attested commit as a new version) · fixed: the name inside the tag object
  must equal the ref; `refs/tags/` used explicitly; test case added.
- `scripts/attest.sh:107` `[correctness|adversarial]` · release regex accepted `foo-v1.2.3`, wider
  than `prod.yml` · fixed: `^v<semver>$`; test case added.
- `justfile:84` `[security|design]` · the CI-change guard runs from the branch's own justfile and
  cannot protect the owner's keys · fixed: comment reworded as a reminder, not a control.
- `justfile:180` `[adversarial]` · `deploy staging` built from whatever `node_modules` held ·
  fixed: `pnpm install --frozen-lockfile` first, `node-guard` dependency.
- `CONTRIBUTING.md:63`, ADR-0001, `justfile:13` `[adversarial]` · no doc said `just gate` must run
  again on `main` after a squash merge · fixed in the three places.
- `PROJECT_LOG.md:164` + ADR-0001 § Consequences `[adversarial]` · the log entry and the ADR
  claimed as done what had not happened (PR number, rulesets, waiver merge) · fixed: the log entry
  moves to the post-merge `docs(log)` PR (repo pattern), the ADR words the bootstrap as a procedure.
- `README.md:32`, `CONTRIBUTING.md:33` `[adversarial]` · `mise trust && just setup` needs `just`
  on PATH before mise installed it · fixed: `mise x -- just setup`.
- `scripts/attest.sh`, `scripts/check-commit-msg.sh`, `justfile` `[adversarial]` · bare `ADR-0004`,
  `#372`, `#213`, `#192` references point to nothing in this repo · fixed: prefixed `agents-skills`.
- `SECURITY.md:13` `[adversarial]` · "disclosed once merged to `main`" exposed prod between the
  merge and the signed tag · fixed: disclosed once released.
- `scripts/smoke.sh:16` `[correctness]` · the server loop could pass against another process on
  the port (`--strictPort` exits) · fixed: `kill -0 "$pid"` in the loop.
- `scripts/test-local-ci.sh:25` `[tests]` · an exported `SONAR_TOKEN` changed the sonar cases ·
  fixed: `unset SONAR_TOKEN SONAR_HOST_URL`.
- `CONTRIBUTING.md:63` `[docs]` · "Branching model A (ADR-0001)" · fixed: agents-skills ADR-0004,
  applied by ADR-0001.

## 🔵 Nice to Have

- `package.json:46` `[adversarial]` · `minimatch@<11.0.1` override too broad · fixed: `>=10 <11.0.1`.
- `scripts/test-local-ci.sh` mode 100644 `[adversarial]` · fixed: 100755.
- `justfile:48` `[docs|adversarial]` · migration narration ("the same `pnpm verify`…") · fixed.
- `.github/allowed_signers:1` `[security]` · key trusted in every namespace · fixed:
  `namespaces="git,local-ci"`.
- `scripts/doc-coverage.sh:6` `[correctness]` · `src/**/*.ts` pathspec missed a root `src/` file ·
  fixed: `:(glob)`; covered by the new test.
- `scripts/smoke.sh:23` `[correctness]` · bundle URL broke on a relative Vite base · fixed.
- `scripts/systemd/brickpix-nightly.service:9` `[correctness]` · nightly runs on whatever tree is
  checked out · follow-up issue (dirty-tree / branch guard).
- `lefthook.yml:26` `[correctness]` · pre-push checks the working tree, not the pushed ref ·
  follow-up issue.
- `.github/workflows/prod.yml:70` `[adversarial]` · `node-version-file: .nvmrc` resolves the latest
  22.x, not the `mise.lock` patch · follow-up issue.
- `scripts/test-local-ci.sh` `[tests|design]` · `deploy`/`attest`/`rehearse`-failure behavioural
  cases, lefthook pre-push run, smoke failure branches · follow-up issue.
- `scripts/check-commit-msg.sh:30` `[correctness]` · 100-character limit counted in bytes · upstream
  (agents-skills issue).

## ⚪ Disagree / Intentional

- `justfile:72-77,104-109,119-121,212-214` `[docs|design]` · two comment blocks per tier recipe ·
  skill `local-ci` § Gotchas: `just --list` shows the last comment line, so the short line stays.
- `scripts/attest.sh:66` `[adversarial]` · `git push` of the notes ref fires the lefthook pre-push
  (`just check` again, ~20 s here) · kept: the agents-skills #372 race test relies on hooks firing
  on that push, and `--no-verify` would belong upstream first; noted in the agents-skills issue.
- `.github/workflows/prod.yml:27` (`classify`), `justfile:129` (`rehearse` with act) `[design]` ·
  required by skill `release-tag` and the `local-ci` L2 row.
- `justfile:216` TruffleHog next to gitleaks `[design]` · the `local-ci` L3 row, second engine
  offline (rule 6).
- `.github/branch-protection.md:38` bootstrap merge through `gh pr merge` under a waiver
  `[adversarial]` · `just merge` cannot verify before `allowed_signers` is on `main`.
- CodeQL → Semgrep CE, Scorecard and dependency-review dropped, no per-PR preview · ADR-0001,
  owner rule 2026-11-07.
- `mise.toml:28` `NODE_EXTRA_CA_CERTS` in shared config `[adversarial]` · harmless on a machine
  without the proxy (the system bundle path); kept.

## Per-dimension summary

- Adversarial: 2 Must (stale comments), 9 Should, all fixed or filed; checked `just check` green,
  rulesets, secrets, the `attest.sh` diff against the shared copy; gate closed → round 2.
- Design: scoped to the real stack; one Must (copies drifting from `~/.claude/scripts`), fixed here
  and sent upstream.
- Docs: no live reference to a removed workflow; one stale comment, fixed.
- Tests: healthy pyramid for a tooling suite; two critical paths untested, now covered (doc-coverage
  behaviour, `write gate <sha>` guards), the rest filed.
- Security: tag ruleset applied, secrets out of the build step's env, tag-name replay refused;
  the `production` environment move stays with the owner.
- Correctness: smoke server check, regex, pathspec and relative base fixed; nightly and pre-push
  ref gaps filed.
