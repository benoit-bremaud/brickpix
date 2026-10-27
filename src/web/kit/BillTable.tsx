import type { BillOfMaterials } from "../../domain/kit";
import type { Palette } from "../../domain/palette";
import { Swatch } from "./Swatch";

type Props = { readonly bom: BillOfMaterials; readonly palette: Palette };

/** Bill of materials: legend number, colour, tiles to place and to buy, then totals and plates. */
export function BillTable({ bom, palette }: Props) {
  const placed = bom.tiles.reduce((sum, line) => sum + line.quantity, 0);
  const bought = bom.tiles.reduce((sum, line) => sum + line.quantity + line.spares, 0);
  return (
    <table className="bill">
      <caption>Liste des pièces</caption>
      <thead>
        <tr><th scope="col">N°</th><th scope="col">Couleur</th><th scope="col">À poser</th><th scope="col">À acheter</th></tr>
      </thead>
      <tbody>
        {bom.tiles.map((line) => (
          <tr key={line.colour.id}>
            <td>{palette.colours.indexOf(line.colour) + 1}</td>
            <td><Swatch colour={line.colour} /> {line.colour.name}</td>
            <td>{line.quantity}</td>
            <td>{line.quantity + line.spares}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><th scope="row" colSpan={2}>Tuiles rondes 1 × 1</th><td>{placed}</td><td>{bought}</td></tr>
        <tr><th scope="row" colSpan={2}>Plaques de base 16 × 16</th><td>{bom.basePlates}</td><td>{bom.basePlates}</td></tr>
      </tfoot>
    </table>
  );
}
