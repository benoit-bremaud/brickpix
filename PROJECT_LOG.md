# Project log — brickpix

Chronological operational logbook. Complements `git log`: decisions, context, what changed and why.

## 2026-10-23 — Project kick-off and brick 1 (bootstrap)

- Idea: a web tool that turns any photo into a LEGO Art mosaic (1×1 round tiles on 16×16 plates),
  with in-app retouching before quantisation, a preview, and a "order my kit" step producing the
  build plan and the parts list. Gift use case. Owner additions the same day: two explicit actions
  ("Aperçu", "Commander mon kit") and giant mosaics made of several plates.
- Decisions (MCDA, weights validated by the owner):
  - Static web app, all client-side, over desktop (365) and mobile (315): 460/500.
  - Vite + React over Next.js (300) and vanilla TS (420): 500/500.
  - Vitest over Jest (350): 475/500.
  - Cloudflare Pages over GitHub Pages (375) and Vercel (400): 480/500 (superseded the same
    day, see the next bullet), for the preview per PR
    and a possible Worker for the BrickLink API later. Fallback: GitHub Pages, a drop-in change of
    one workflow.
  - Revised the same day: `wrangler pages project create` (wrangler 4.151) no longer creates a
    Pages project, it migrates to Workers static assets and deployed a Worker `brickpix` on the
    spot. Re-scored: Workers static assets 460 over classic Pages 390 and GitHub Pages 365
    (Pages is frozen by Cloudflare; previews come from `wrangler versions upload`). Kept the
    Worker and `wrangler.jsonc`, removed the Vite plugin the command had added.
  - Name `brickpix`: GitHub account and npm name free, one homonymous student repo; `pixelbrick`
    rejected (existing GitHub organisation and published apps).
- Prior art noted: `debkbanerji/lego-art-remix`, `ryantimpe/brickr`, `lucaswo/Pic2Brick`. None
  offers interactive retouching before quantisation, which is the differentiator.
- Brick 1 (issue #1, branch `chore/1-bootstrap`): public repo, GitHub Project #72, labels,
  Vite + React + TypeScript strict, Vitest with 80 % thresholds, ESLint (no default exports, pure
  `src/domain`), CI verify, Gitleaks, CodeQL, dependency review, OSSF Scorecard, Dependabot, local
  SonarQube gate script, Cloudflare Workers deploy workflow, documentation skeleton.
- Owner rule in `CLAUDE.md`: no validated UML study, no code. Brick 2 is the conception.
- Local review gate on the bootstrap (`docs/architecture/review-local.md`): 1 code Must (the
  domain purity lint also hit domain tests), 3 documentation Musts (repository settings behind
  the text: squash-only merges, private vulnerability reporting, issue title), 14 Should. All
  Must and the cheap Should fixed before the push: compiler-enforced domain purity
  (`tsconfig.domain.json`), complexity lint, web test glob and Testing Library cleanup, deploy
  runs the full gate with a concurrency group, Dependabot cooldown, Gitleaks least privilege.
  Remaining Nice items are listed in the report. Gate: tests 1/1, coverage 100 %, docs 100 % (one
  exported symbol), SonarQube passed, Gitleaks clean, QA smoke screenshot under
  `docs/architecture/qa/`.
- **PR #2 merged** (`edd5644`) — chore(repo): bootstrap brickpix. Branch `chore/1-bootstrap`,
  squash, closes #1. Review cycle: three Codex rounds, four P2 findings, all fixed and answered
  inline (`pnpm sonar` now keeps the scanner exit status and fails when the status script fails;
  `engines.node` is the range jsdom 30 declares, `^22.22.2 || ^24.15.0 || >=26.0.0`; README gives
  the pnpm install path for Node 25+ without Corepack; the domain purity lint caps relative
  imports per nesting depth so none can climb out of `src/domain`). Fourth round: no findings.
  Repository secrets `CLOUDFLARE_API_TOKEN` (token `token-cloudflare-brickpix-ci-2026`, Workers
  Scripts edit + Account Settings read + User Details read, one account, expires 2027-10-23) and
  `CLOUDFLARE_ACCOUNT_ID` set the same day; PR preview and production deploy both green.
- Pending: the custom domain under the owner's portfolio (`brickpix.benoitbremaud.fr`, a
  `routes` entry with `custom_domain` in `wrangler.jsonc`).
- **PR #6 merged** (`efd08b4`) — docs(architecture): UML study of the photo-to-mosaic flow, closes
  #5 (brick 2). Six Mermaid diagrams under `docs/architecture/diagrams/mosaic/`. Owner decisions
  (2026-10-23): cost estimate and optional frame after V1; live debounced preview; size in whole
  16×16 plates (min 1, default 3×3) drives the crop ratio; Web Worker deferred until measured;
  sharpen and plate legend in V1; printing the plan is the only user-directed egress of
  photo-derived data. Local gate: 2 Must, 7 Should fixed. Codex round 1: four P2 (stale kit after
  debounce, failed import from the kit, size into retouch, print egress), all fixed and answered
  inline. **Waiver**: Codex round 2 not run (usage limit reached); owner merged on the local gate
  (tests, coverage 100 %, SonarQube passed, Gitleaks clean) and green CI.
- Backlog ordered on Project #72: #7 palette spec, #8 import + size + live preview, #9 kit
  (plan, bill of materials, BrickLink XML), #10 retouch, #11 custom domain, #12 supplier study
  (order from the site), #13 cost estimate, #14 optional frame. Owner note on #7/#12: the palette
  must match the supplier's stocked colours.
