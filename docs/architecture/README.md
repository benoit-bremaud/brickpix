# Architecture

Feature `mosaic` (photo to kit), brick 2: [`diagrams/mosaic/`](diagrams/mosaic/), six UML diagram
types (`NN-<type>.md`, Mermaid). Use cases validated by the owner on 2026-10-23 (cost estimate out of V1):

| NN | Type | Question it answers |
|----|------|---------------------|
| 01 | use-case | Which goals does the user initiate? (import, retouch, preview, order the kit) |
| 02 | sequence | How does a photo flow from import to the build plan? |
| 03 | component | Which modules exist and who depends on whom? (`domain` pure, `web` on Canvas) |
| 04 | class | Palette, tile, mosaic, plate, bill of materials |
| 05 | state | The editor's states (empty, editing, kit ready) |
| 06 | data-flow | Pixels in, tiles and lists out |

Decisions will be recorded as MADR files under `decisions/` once the first one is taken in a study.
