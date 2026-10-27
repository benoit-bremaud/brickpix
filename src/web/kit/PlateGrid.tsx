import type { PlatePlan } from "../../domain/kit";
import type { Palette } from "../../domain/palette";
import { inkOn } from "./ink";
import { cssColour, Swatch } from "./Swatch";

type Props = { readonly plate: PlatePlan; readonly number: number; readonly palette: Palette };

/** One plate of the plan: 16 × 16 coloured studs carrying their legend number, then the legend. */
export function PlateGrid({ plate, number, palette }: Props) {
  const studs = palette.colours.map((colour) => ({ background: cssColour(colour), ink: inkOn(colour.rgb) }));
  const caption = `Plaque ${number} (colonne ${plate.column + 1}, rangée ${plate.row + 1})`;
  return (
    <figure className="plate" aria-label={caption}>
      <figcaption>{caption}</figcaption>
      <div className="plate-grid">
        {Array.from(plate.cells, (index, cell) => (
          <span key={cell} className="stud" data-ink={studs[index]?.ink} style={{ background: studs[index]?.background }}>
            {index + 1}
          </span>
        ))}
      </div>
      <ul className="legend">
        {plate.legend.map((colour) => (
          <li key={colour.id}><Swatch colour={colour} /> {palette.colours.indexOf(colour) + 1} — {colour.name}</li>
        ))}
      </ul>
    </figure>
  );
}
