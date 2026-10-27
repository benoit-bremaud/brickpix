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
- **PR #16 merged** (`cbe8f16`) — feat(domain): palette of 1x1 round tiles, closes #7 (brick 3).
  Spec `docs/architecture/specs/palette-round-tiles.md` and frozen table
  `src/domain/palette.ts`: 17 opaque colours of BrickLink part 98138, in production (2025-26 sets)
  and above 2,000 BrickLink lots, checked 2026-10-23 (BrickLink catalogue, Rebrickable CSV). Owner
  MCDA: the 16 most stocked plus Dark Brown (465/500, against 16 colours 415 and ~35 colours 335).
  LEGO Pick a Brick could not be checked; the supplier study (#12) revalidates the table. Local
  gate: 0 Must, 2 Should fixed (deep freeze; the test parses the spec and checks all 17 rows).
  **Waiver** (owner, 2026-10-24): Codex hit its usage limit again; merged on the local gate
  (tests and docs 100 %, SonarQube passed, Gitleaks clean) and green CI.
- **PR #18 merged** (`efe3e3c`) — feat(image): import, mosaic size and live preview, closes #8
  (brick 4). Spec `docs/architecture/specs/quantise-mosaic.md`, validated by the owner on
  2026-10-27. Until #10 the crop is the largest N:M rectangle centred in the photo. Resampling is
  an area average with transparency composited over white. Each stud takes the nearest palette
  colour by CIEDE2000 (checked against 10 Sharma reference pairs). Floyd–Steinberg dithering is
  optional, with a serpentine scan. The preview refreshes after a 150 ms debounce. Decoding
  resizes the photo to a 2048 px longest side and never builds the full-size bitmap. Owner MCDA:
  at most 8 plates per side, 470/500 (measured on a laptop: 8×8 in 88 ms, 16×16 in 335 ms), and
  dithering off by default, 430/500. Local gate: 1 Must (diagrams out of step with the code) and
  8 Should, all fixed. SonarQube flagged 3 new issues (2 accessibility, 1 CSS duplicate), all
  fixed. Codex round 1 left 3 findings (a P1 file input unreachable by keyboard, a P2 full-size
  decode, a P2 error from a superseded import), all fixed and answered inline. Round 2 found
  nothing. Copilot posted no review. Gate: 55 tests, 100 % of lines and 94.9 % of branches,
  docs 100 %, SonarQube passed, Gitleaks clean, QA report and screenshots in
  `docs/architecture/qa/2026-10-27-preview.md`.
- **PR #26 merged** (`2eece77`) — feat(export): kit with build plan per plate, bill of materials
  and BrickLink list, closes #9 (brick 5) and #29. Spec `docs/architecture/specs/kit.md`. The kit
  recomputes the mosaic from the current inputs, shows «Préparation du kit…» first and freezes
  the inputs (`inert`) meanwhile; the pending preview is dropped. Plates paint lazily
  (`content-visibility: auto`, visible in print): 8×8 on a 4× slowed CPU went from 1250 ms to
  about 600 ms, feedback in under 5 ms. Owner MCDA: busy state + lazy paint 400/500 (#28 stays
  open for the phone budget), bill scroll region with `tabIndex={0}` + justified NOSONAR S6845
  445/500 (WebKit does not focus scroll regions). Two local reviews and a full QA pass
  (`docs/architecture/qa/2026-10-27-kit-full.md`). Every Must and Should of the local reviews is
  fixed; two QA Shoulds stay open: security headers (#24) and a pending dev-dependency update.
  Codex: 3 P2
  findings (stale inputs, table reflow at 200 % text, pending preview), all fixed and answered
  inline. Review threads must be resolved before the merge (branch rule). Gate: 100 tests, 100 %
  of lines and 94 % of branches, docs 100 %, SonarQube passed, Gitleaks clean.
- **PR #34 merged** (`1ec3b5b`): chore(deps), update wrangler to 4.152.0 and its tooling
  dependencies, with an `undici` override scoped to wrangler. The advisory gave no detail.
- **PR #39 merged** (`a0f81ea`): feat(image), retouch before quantisation, closes #10 (brick 6).
  Spec `docs/architecture/specs/retouch.md`, validated by the owner on 2026-10-27; diagrams
  01–06 updated.
  - Chain: orient → crop → resample → brightness → contrast → saturation → sharpen →
    background → quantise. The tone steps run on the stud grid.
  - Three tools in a minimalist toolbar with progressive disclosure:
    - «Cadrer»: zoom 1–8, pan, quarter turn, mirror, size steppers, handles that stretch the size.
    - «Ambiance»: Auto, the moods Naturel, Pop, Doux and N&B, and «Plus» for the sliders and
      dithering.
    - «Fond»: CIEDE2000 region growing from the top and side borders, with a tolerance from 5 to 20.
  - A long press or Space shows the photo before retouch. A new photo resets the retouch and
    keeps the size. The photo never leaves the browser.
  - Local review: 2 Must, both fixed. The component diagram had drifted, and the bottom corners
    were seeded although the spec excludes the bottom row. 5 Should fixed. The clamp refactor,
    the one-component-per-file split and the renames are deferred to #38.
  - SonarQube flagged 12 new smells, all fixed: read-only props, a `fieldset` toolbar, a nested
    ternary.
  - Codex left 7 P2 findings over 5 rounds, all fixed and answered inline:
    - clamp brightness before contrast;
    - end «before» on blur;
    - a white matte under transparent pixels;
    - keep a draggable middle in small frames;
    - drag the frame with the finger;
    - wheel zoom scaled by distance.

    It was still reviewing the last commit when the owner authorised the merge on a green local
    CI.
  - Gate: 156 tests, 98.9 % of statements, 88.5 % of branches and 100 % of lines covered,
    SonarQube passed, Gitleaks clean. QA reports: `docs/architecture/qa/2026-10-27-retouch.md`
    (full pass) and `…-retouch-smoke.md`.
  - Follow-ups: #35, #36, #37 (remove the LEGO trademark), #38.
