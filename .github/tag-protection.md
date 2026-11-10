# Tag protection — `refs/tags/v*`

Release tags are immutable once published (skill `release-tag` § Protection): nobody creates,
moves or deletes a `v*` tag outside the owner's release procedure, and `prod.yml` (ADR-0001) only
ever sees a tag the owner signed. This file documents the ruleset to apply and the exact commands;
the configuration itself lives on GitHub (repository ruleset `release tags`, id `26949817`, created
2026-11-10), not in the repository.

## Policy

| Setting | Value |
|---|---|
| Target | tags matching `refs/tags/v*` |
| Rules | `creation`, `update`, `deletion` blocked, `non_fast_forward` blocked |
| Enforcement | `active` |
| Bypass | `RepositoryRole` Admin (`actor_id` 5), mode `always` — the owner keeps routine-release rights and an emergency escape hatch |

Tags are SSH-signed at creation (`git tag -s vX.Y.Z`, `tag.gpgSign` is set in this clone) with a
key listed in `.github/allowed_signers`; `scripts/attest.sh release <tag>` verifies the signature
before any production deploy, in `prod.yml` and in the laptop fallback `just deploy prod <tag>`.

## Apply (one-time, by owner)

```bash
gh api repos/benoit-bremaud/brickpix/rulesets --method POST --input - <<'EOF'
{
  "name": "release tags",
  "target": "tag",
  "enforcement": "active",
  "bypass_actors": [ { "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always" } ],
  "conditions": { "ref_name": { "include": ["refs/tags/v*"], "exclude": [] } },
  "rules": [
    { "type": "creation" },
    { "type": "update" },
    { "type": "deletion" },
    { "type": "non_fast_forward" }
  ]
}
EOF
```

## Verify

```bash
gh api repos/benoit-bremaud/brickpix/rulesets --jq '.[] | select(.target == "tag") | .id' \
  | xargs -I{} gh api repos/benoit-bremaud/brickpix/rulesets/{} --jq '{
      name, enforcement,
      include: .conditions.ref_name.include,
      rules: [.rules[].type],
      bypass: [.bypass_actors[] | "\(.actor_type):\(.actor_id):\(.bypass_mode)"] }'
```

Expected:

```json
{
  "name": "release tags",
  "enforcement": "active",
  "include": ["refs/tags/v*"],
  "rules": ["creation", "update", "deletion", "non_fast_forward"],
  "bypass": ["RepositoryRole:5:always"]
}
```

## Remove (emergency only)

```bash
gh api repos/benoit-bremaud/brickpix/rulesets/26949817 --method PATCH -f enforcement=disabled
```

Re-enable immediately after the emergency; log the reason in `PROJECT_LOG.md`.
