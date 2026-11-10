# Local CI (#53, skill local-ci, ADR-0001): four tiers, one recipe each, no GitHub and no AI agent
# needed. GitHub Actions runs one workflow, prod.yml: a signed stable tag `v*` deploys the
# Cloudflare Worker (agents-skills ADR-0004). Tools come from mise.toml (`just setup`); run through
# `mise x -- just <tier>` when the shell does not activate mise (the git hooks do).
#
#   L0 fast     pre-commit hook                        staged files only                       < 10 s
#   L1 check    pre-push hook, review-local --push     lint + test + security + secrets        < 3 min
#   L2 gate     review-local § 2b, on the pushed head  check + Sonar + smoke + rehearse,       5–15 min
#               before every merge                     then the attestation
#   L3 nightly  systemd user timer                     check + TruffleHog + toolchain drift
#
# Then: `just merge <pr>` (refuses without the gate attestation on the head SHA),
# `just deploy staging` from attested main, `just attest staging` after the QA pass,
# `git tag -s vX.Y.Z` → prod.yml (fallback: `just deploy prod <tag>`).

set shell := ["sh", "-eu", "-c"]

# L1 by default
default: check

# Once per clone: the pinned toolchain, the dependencies and the git hooks
setup:
    mise install
    mise x -- pnpm install --frozen-lockfile
    mise x -- lefthook install

# L0 — the pre-commit checks on the staged files (< 10 s)
fast:
    lefthook run pre-commit

# Fail fast outside the .nvmrc Node major: an nvm or system Node in a non-interactive shell would
# run the whole suite on the wrong runtime. Fix: `mise x -- just <recipe>`.
[private]
node-guard:
    @node -e 'const want=require("fs").readFileSync(".nvmrc","utf8").trim().split(".")[0]; const v=process.versions.node; if (v.split(".")[0] !== want) { console.error("Node " + v + " found, Node " + want + " required (.nvmrc). Run: mise x -- just <recipe>"); process.exit(1) }'

# eslint (with the domain purity rule), tsc (app and domain projects), the shell scripts, the hooks,
# the one workflow left (actionlint syntax, zizmor security audit)
lint: node-guard
    pnpm lint
    pnpm typecheck
    shellcheck --severity=warning scripts/*.sh
    lefthook validate
    actionlint
    zizmor --quiet .github/workflows

# Vitest with the coverage floor of vite.config.ts (80 %), doc coverage >= 90 %, the local CI wiring
# tests, then the production build (the same `pnpm verify` the former ci.yml ran, in four steps)
test: node-guard
    pnpm test:coverage
    sh scripts/doc-coverage.sh
    sh scripts/test-local-ci.sh
    sh scripts/test-attest.sh
    pnpm exec vite build

# SAST (Semgrep Community Edition, named registry rulesets: `--config auto` would send the project
# URL; no p/secrets, which prints the matched value, gitleaks redacts it) on src (replaces CodeQL),
# then known vulnerabilities in every dependency, dev ones included, moderate and above (the
# threshold of the former dependency-review workflow). EIO_BACKEND=posix: semgrep-core otherwise
# opens io_uring rings charged to RLIMIT_MEMLOCK with every Electron process, and dies intermittently.
security:
    EIO_BACKEND=posix semgrep scan --config p/javascript --config p/typescript --error --metrics=off --quiet -j 4 src
    pnpm audit --audit-level moderate

# Secrets in the whole git history (replaces the gitleaks workflow)
secrets:
    gitleaks git --redact --no-banner .

# L1 — pre-push (< 3 min)
check: lint test security secrets

# L2 — pre-merge, called by review-local § 2b (base: the branch to integrate into), 5–15 min.
# Ends with the gate attestation (agents-skills ADR-0003): commit status `gate` + signed note on
# HEAD, which must already be pushed and up to date with `base`, so it runs on the pushed head only;
# the clean-tree and pushed checks run first, not after 10 minutes in `attest.sh write`.
# L2 — pre-merge on the pushed head: check + Sonar + smoke + rehearse, then the attestation
gate base="origin/main":
    #!/bin/sh
    set -eu
    base={{quote(base)}}
    [ -z "$(git status --porcelain)" ] || { echo "gate: commit or set aside local changes first" >&2; exit 1; }
    case "$base" in origin/*) git fetch --quiet origin "${base#origin/}" ;; esac
    git merge-base --is-ancestor "$base" HEAD || { echo "gate: HEAD is behind $base, merge or rebase it first" >&2; exit 1; }
    # The gate runs the branch's own recipes and scripts with the owner's keys and tokens: a branch
    # that changes them is gated only after a human read those files (GATE_CI_CHANGE=1).
    ci=$(git diff --name-only "$base...HEAD" -- justfile lefthook.yml mise.toml mise.lock .nvmrc scripts .github package.json pnpm-lock.yaml vite.config.ts eslint.config.js sonar-project.properties wrangler.jsonc 'tsconfig*.json')
    [ -z "$ci" ] || [ "${GATE_CI_CHANGE:-0}" = 1 ] || { echo "gate: this branch changes the local CI itself ($(printf '%s' "$ci" | tr '\n' ' ')): read those files, then run GATE_CI_CHANGE=1 just gate" >&2; exit 1; }
    [ -n "$(git branch -r --contains HEAD)" ] || { echo "gate: push HEAD first (the attestation is written on the pushed head)" >&2; exit 1; }
    # `check` runs from the body, not as a dependency, so the HEAD it checked is the one attested.
    start=$(git rev-parse HEAD)
    just check
    just sonar
    just smoke
    changed=$(git diff --name-only --diff-filter=d "$base...HEAD" -- .github/workflows)
    if [ -z "$changed" ]; then echo "gate: no workflow added or changed, act skipped"
    elif ! docker info > /dev/null 2>&1; then echo "gate: WARNING docker unreachable, act not run" >&2; exit 3
    else printf '%s\n' "$changed" | while IFS= read -r w; do just rehearse "$w"; done; fi
    [ "$(git rev-parse HEAD)" = "$start" ] || { echo "gate: HEAD moved during the gate ($start checked), run it again" >&2; exit 1; }
    sh scripts/attest.sh write gate "$start"

# SonarQube analysis on the local Community Build with the token of ~/.config/sonar-tokens/brickpix
# (fallback: the global analysis token ~/.config/sonarqube/analysis-token, skill infra-accounts),
# waiting for the quality gate. It uploads coverage/lcov.info, so it refuses a report older than
# the sources: `just test` writes it first.
# SonarQube analysis with quality-gate wait (step of gate)
sonar:
    #!/bin/sh
    set -eu
    command -v sonar-scanner > /dev/null || { echo "sonar: sonar-scanner not on PATH (system tool, skill local-ci rule 2)" >&2; exit 1; }
    [ -f coverage/lcov.info ] || { echo "sonar: run just test first (coverage/lcov.info missing)" >&2; exit 1; }
    stale=$(find src -newer coverage/lcov.info -type f -print -quit)
    [ -z "$stale" ] || { echo "sonar: coverage/lcov.info is older than $stale; run just test" >&2; exit 1; }
    SONAR_TOKEN="${SONAR_TOKEN:-$(cat "$HOME/.config/sonar-tokens/brickpix" 2>/dev/null || cat "$HOME/.config/sonarqube/analysis-token" 2>/dev/null || true)}"
    [ -n "$SONAR_TOKEN" ] || { echo "sonar: no token in SONAR_TOKEN, ~/.config/sonar-tokens/brickpix or ~/.config/sonarqube/analysis-token" >&2; exit 1; }
    url="${SONAR_HOST_URL:-http://localhost:9000}"
    curl -sf -m 5 "$url/api/system/status" | grep -q '"status":"UP"' || { echo "sonar: SonarQube is not UP at $url, start it first" >&2; exit 1; }
    SONAR_TOKEN="$SONAR_TOKEN" sonar-scanner -Dsonar.host.url="$url" -Dsonar.projectVersion="$(node -p "require('./package.json').version")" -Dsonar.qualitygate.wait=true

# The production build served by `vite preview`, as Cloudflare Workers will: 200, the title and a
# fetchable bundle (scripts/smoke.sh). Step of gate, not of check. The browser QA runs on staging.
# Build the bundle and smoke-test it on the preview server (step of gate)
smoke: node-guard
    pnpm exec vite build
    sh scripts/smoke.sh

# Rehearse a workflow with act (L2, needs docker): dry run of the whole graph, then for the prod
# workflow (ADR-0004) a real run of its `classify` job on fake tag events. The deploy job never
# runs and act gets no secret. The tag prefix is read from the workflow's PREFIX.
rehearse workflow:
    #!/bin/sh
    set -eu
    w={{quote(workflow)}} img=ubuntu-latest=catthehacker/ubuntu:act-24.04 dir=$(git rev-parse --git-dir)
    act --dryrun -P "$img" -W "$w" < /dev/null
    grep -q '^  classify:' "$w" || exit 0
    p=$(sed -n 's/^  PREFIX: *\([^ #]*\).*/\1/p' "$w" | tr -d "'\"")
    trap 'rm -f "$dir/act-event.json" "$dir/act.log"' EXIT
    for case in "${p}1.2.3:stable" "${p}1.2.3-rc.1:prerelease" not-a-tag:refused; do
      tag=${case%:*} want=${case##*:}
      printf '{"ref":"refs/tags/%s"}\n' "$tag" > "$dir/act-event.json"
      if act push -e "$dir/act-event.json" -j classify -P "$img" -W "$w" < /dev/null > "$dir/act.log" 2>&1
      then got=$(sed -n 's/.*::set-output:: channel=//p' "$dir/act.log" | tail -1) # act 0.2.92 log format
      else got=refused; fi
      [ "$got" = "$want" ] || { cat "$dir/act.log"; echo "rehearse: $tag gave '$got', expected $want" >&2; exit 1; }
    done
    echo "rehearse: $w classify ok (stable, prerelease, refused)"

# Merge a PR only when its exact head SHA carries the gate attestation (agents-skills ADR-0003).
# The verifier is read from origin/main. Squash, as every merge of this repository. Same-repository
# PRs only (the head is fetched from origin).
merge pr:
    #!/bin/sh
    set -eu
    pr={{quote(pr)}}
    case "$pr" in ''|*[!0-9]*) echo "merge: usage just merge <pr number>" >&2; exit 1 ;; esac
    sha=$(gh pr view "$pr" --json headRefOid -q .headRefOid)
    git fetch --quiet origin main "$sha"
    # The verifier of origin/main, never the checkout's: a branch cannot ship its own.
    verifier=$(mktemp); trap 'rm -f "$verifier"' EXIT
    git show origin/main:scripts/attest.sh > "$verifier"
    sh "$verifier" verify gate "$sha"
    gh pr merge "$pr" --squash --match-head-commit "$sha"

# Deploy what was attested, from a clean tree (skill environments, branching model A). staging:
# up-to-date main after a green gate, as the Worker version alias `staging`
# (staging-brickpix.<subdomain>.workers.dev). prod: fallback when Actions cannot run (ADR-0004):
# classify, verify-tag, peel, status + notes (attest.sh release), deployed from the tag's commit,
# then back to the branch; log it in PROJECT_LOG.md. Needs the Cloudflare token in the environment
# (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) or a `wrangler login`.
deploy env tag="":
    #!/bin/sh
    set -eu
    env={{quote(env)}} tag={{quote(tag)}}
    [ -z "$(git status --porcelain)" ] || { echo "deploy: commit or stash local changes first" >&2; exit 1; }
    case "$env" in
      staging)
        git fetch --quiet origin main
        [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] \
          || { echo "deploy: staging deploys from up-to-date main only" >&2; exit 1; }
        sh scripts/attest.sh verify gate HEAD
        pnpm exec vite build
        pnpm exec wrangler versions upload --preview-alias staging --message "staging $(git rev-parse --short HEAD)"
        ;;
      prod)
        [ -n "$tag" ] || { echo "deploy: usage just deploy prod <tag>" >&2; exit 1; }
        # this recipe and attest.sh must be the trusted ones of main, never a branch's; same checks
        # as prod.yml
        git fetch --quiet origin main tag "$tag"
        [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] \
          || { echo "deploy: run the prod fallback from up-to-date main" >&2; exit 1; }
        sha=$(sh scripts/attest.sh release "$tag")
        back=$(git symbolic-ref --quiet --short HEAD || git rev-parse HEAD)
        trap 'git checkout --quiet "$back"' EXIT
        git -c advice.detachedHead=false checkout --quiet "$sha"
        pnpm install --frozen-lockfile
        pnpm exec vite build
        pnpm exec wrangler deploy
        echo "deploy: prod deployed from $tag ($sha) by the local fallback: log it in PROJECT_LOG.md"
        ;;
      *) echo "deploy: unknown environment $env (staging, prod)" >&2; exit 1 ;;
    esac

# Record the staging QA pass on the deployed main commit — run only after it succeeded (ADR-0004)
attest env:
    #!/bin/sh
    set -eu
    [ {{quote(env)}} = staging ] || { echo "attest: only staging is attested" >&2; exit 1; }
    git fetch --quiet origin main
    [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] \
      || { echo "attest: HEAD is not the deployed origin/main" >&2; exit 1; }
    sh scripts/attest.sh write deploy/staging

# L3 — nightly, systemd user timer (no time budget): deep secret history (TruffleHog, offline) and
# toolchain drift: scripts/toolchain-drift.sh fails on a mise.toml tool behind its latest release.
# L3 — nightly (systemd timer): check + TruffleHog + toolchain drift
nightly: check
    trufflehog git "file://$PWD" --no-verification --fail --no-update
    sh scripts/toolchain-drift.sh
