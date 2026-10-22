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
  - Cloudflare Pages over GitHub Pages (375) and Vercel (400): 480/500, for the preview per PR
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
- Pending after merge: repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
  (owner), then the custom domain under the owner's portfolio (`brickpix.benoitbremaud.fr`, a
  `routes` entry with `custom_domain` in `wrangler.jsonc`).
