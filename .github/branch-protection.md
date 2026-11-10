# Branch protection — `main`

`main` only moves through squash-merged pull requests whose head carries the `gate` attestation.
This file documents the ruleset to apply and the exact commands; the configuration itself lives
on GitHub (repository ruleset `main`, id `25682220`, created 2026-10-23), not in the repository.

## Policy

| Setting | Value |
|---|---|
| Require a pull request before merging | yes, squash only, every review thread resolved |
| Required status checks | `gate` — the commit status written by `just gate` on the pushed head together with its signed note (ADR-0001, skill `local-ci`); branch up to date before merge (strict) |
| Required approving reviews | 0 (solo repository, no reviewer bot; 1 once one exists) |
| Dismiss stale approvals on new commits | yes |
| Bypass actors | none — the owner is bound by a gate they can satisfy |
| Force push (`non_fast_forward`) | blocked |
| Branch deletion | blocked |

The required check is a commit status, not a workflow job: no GitHub workflow runs on a pull
request (ADR-0001). `scripts/attest.sh write gate` posts `gate` = success through the REST
Statuses API, last, after the signed note is pushed, so a green status always has its note;
`just merge <pr>` verifies both on the exact head SHA before `gh pr merge`. Run `just merge` from
an up-to-date `main` checkout, so the `merge` recipe itself is the trusted one.

A status is added to the required checks only after it has reported once on a pull request;
otherwise every pull request would wait for a check that never reports. On the bootstrap pull
request (the one that introduces ADR-0001): run `just gate` on its pushed head first (the first
`gate` report), then apply the ruleset below, replacing the deleted workflow jobs `verify`,
`gitleaks` and `sonarqube` that would never report again, then merge with `gh pr merge` under the
owner's explicit waiver (`.github/allowed_signers` is not on `main` yet, so `just merge` cannot
verify the note). Every later merge goes through `just merge <pr>`.

The `gate` status alone is a plain API write that anyone with push access could post; the signed
note, verified against the trust store of `origin/main`, is the real control, and only `just merge`
checks it. The owner therefore merges through `just merge` only, never the GitHub button; no
collaborator holds write access and personal tokens keep the minimal scopes.

## Apply (one-time, by owner)

```bash
gh api repos/benoit-bremaud/brickpix/rulesets/25682220 --method PUT --input - <<'EOF'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "allowed_merge_methods": ["squash"],
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_approving_review_count": 0,
        "required_review_thread_resolution": true } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [ { "context": "gate" } ] } }
  ]
}
EOF
```

`integration_id` is omitted on the `gate` check so GitHub accepts the status from whoever last
reported it (the owner's `gh`, through `scripts/attest.sh`).

## Verify

```bash
gh api repos/benoit-bremaud/brickpix/rulesets/25682220 --jq '{
  enforcement,
  checks: [.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context],
  strict: [.rules[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy][0],
  reviews: [.rules[] | select(.type == "pull_request") | .parameters.required_approving_review_count][0],
  methods: [.rules[] | select(.type == "pull_request") | .parameters.allowed_merge_methods][0],
  rules: [.rules[].type] }'
```

Expected:

```json
{
  "enforcement": "active",
  "checks": ["gate"],
  "strict": true,
  "reviews": 0,
  "methods": ["squash"],
  "rules": ["deletion", "non_fast_forward", "pull_request", "required_status_checks"]
}
```

## Remove (emergency only)

```bash
gh api repos/benoit-bremaud/brickpix/rulesets/25682220 --method PATCH -f enforcement=disabled
```

Re-enable (`-f enforcement=active`) immediately after the emergency; log the reason in
`PROJECT_LOG.md`.
