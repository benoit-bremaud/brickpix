# brickpix — project instructions

Photo to LEGO Art mosaic, in the browser. Product intent lives in `docs/product/`, the conception
in `docs/architecture/`. Read them before changing anything.

## No conception, no code (owner rule, non-negotiable)

- Every line of code implements a validated UML study under `docs/architecture/`.
- If the study for a feature does not exist or is not validated by the owner, **no implementation
  code is written** for it. Write or complete the study first, get it validated, then code.
- A change that needs behaviour the study does not describe updates the study first, in the same PR
  or an earlier one.

## Status

Brick 1 tooling in place (Vite + React + TypeScript strict, Vitest, ESLint dependency rule, CodeQL,
Gitleaks, dependency review, Scorecard, local SonarQube gate, Cloudflare Workers static assets).
No domain code
yet. Checks: `pnpm verify`, then `pnpm sonar` after push.

## Project invariants

- **Dependency rule**: `src/domain/` (palette, quantisation, build plan, bill of materials) is pure
  TypeScript over typed arrays. It never imports a package, the DOM or React. `src/web/` renders and
  drives it through Canvas.
- **Privacy**: the photo and every derived image stay in the browser. No upload, no analytics on
  image content.
- **Conception is the source of truth**: code follows `docs/architecture/`. When they diverge, fix
  the code or update the diagram in the same change.
- **No default exports**, no `any`, design tokens for every colour and spacing in the UI.

## Where things live

- Product: `docs/product/` (vision, later personas, journeys and roadmap).
- Diagrams: `docs/architecture/diagrams/<feature>/`, one folder per feature, six UML types.
- Decisions: `docs/architecture/decisions/` (MADR, one per file), once the first one exists.
- Logbook: `PROJECT_LOG.md`, updated after every merge.
- Kanban: GitHub Project #72 (`PVT_kwHOB8rwIc4BoTlZ`), Status Todo / In Progress / Done.
