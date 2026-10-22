# Architecture

No validated study yet. Brick 2 produces the conception for the first feature set, under
`diagrams/<feature>/`, with the six UML diagram types (`NN-<type>.md`, Mermaid):

| NN | Type | Question it answers |
|----|------|---------------------|
| 01 | use-case | Which goals does the user initiate? (import, retouch, preview, order the kit) |
| 02 | sequence | How does a photo flow from import to the build plan? |
| 03 | component | Which modules exist and who depends on whom? (`domain` pure, `web` on Canvas) |
| 04 | class | Palette, tile, mosaic, plate, bill of materials |
| 05 | state | The editor's states (empty, retouching, previewed, exported) |
| 06 | data-flow | Pixels in, tiles and lists out |

Decisions will be recorded as MADR files under `decisions/` once the first one is taken in a study.
