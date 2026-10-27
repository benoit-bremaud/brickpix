import { tilesToBuy, type BillOfMaterials } from './kit';

/** BrickLink part of the 1 × 1 round tile. */
const ROUND_TILE_PART = '98138';
/** BrickLink part of the 16 × 16 base plate. */
const BASE_PLATE_PART = '91405';
/** BrickLink colour id of Black, the only colour the base plate is ordered in (spec kit.md). */
const BASE_PLATE_COLOUR_ID = 11;

function item(part: string, colourId: number, quantity: number): string {
  return `  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>${part}</ITEMID><COLOR>${colourId}</COLOR><MINQTY>${quantity}</MINQTY><CONDITION>N</CONDITION></ITEM>`;
}

/**
 * BrickLink wanted-list XML (spec kit.md): tiles to buy per colour, then the base plates.
 * Starts with `<INVENTORY>` so it can be pasted as is. Only integers and fixed ids, no escaping.
 */
export function toBrickLinkXml(bom: BillOfMaterials): string {
  const lines = bom.tiles.map((line) => item(ROUND_TILE_PART, line.colour.brickLinkColorId, tilesToBuy(line)));
  lines.push(item(BASE_PLATE_PART, BASE_PLATE_COLOUR_ID, bom.basePlates));
  return ['<INVENTORY>', ...lines, '</INVENTORY>', ''].join('\n');
}
