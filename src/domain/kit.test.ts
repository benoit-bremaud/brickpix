import { describe, expect, it } from 'vitest';

import { toBrickLinkXml } from './brickLinkXml';
import { relativeLuminance } from './colour';
import { billOfMaterials, buildPlan } from './kit';
import { studsOf, type Mosaic, type MosaicSize } from './mosaic';
import { ROUND_TILE_PALETTE } from './palette';

/** A mosaic whose stud value is `valueAt(x, y)`. */
function mosaicOf(size: MosaicSize, valueAt: (x: number, y: number) => number): Mosaic {
  const { width, height } = studsOf(size);
  const cells = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) cells[y * width + x] = valueAt(x, y);
  return { size, palette: ROUND_TILE_PALETTE, cells };
}

/** Each plate filled with its own reading-order number as palette index. */
const byPlate = (size: MosaicSize) =>
  mosaicOf(size, (x, y) => Math.floor(y / 16) * size.platesWide + Math.floor(x / 16));

describe('buildPlan', () => {
  it('gives one plate for a 1 × 1 mosaic, with the whole grid', () => {
    const mosaic = mosaicOf({ platesWide: 1, platesHigh: 1 }, (x, y) => (x + y) % 2);
    const plates = buildPlan(mosaic);
    expect(plates).toHaveLength(1);
    expect(plates[0]).toMatchObject({ column: 0, row: 0, cells: mosaic.cells });
  });

  it('numbers plates in reading order and slices each 16 × 16 block', () => {
    const plates = buildPlan(byPlate({ platesWide: 3, platesHigh: 2 }));
    expect(plates.map((plate) => [plate.column, plate.row])).toEqual([
      [0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1],
    ]);
    plates.forEach((plate, number) => {
      expect(plate.cells).toHaveLength(256);
      expect(plate.cells.every((cell) => cell === number)).toBe(true);
    });
  });

  it('keeps x and y in place inside each plate', () => {
    const valueAt = (x: number, y: number) => (x * 3 + y) % 17;
    const plates = buildPlan(mosaicOf({ platesWide: 2, platesHigh: 2 }, valueAt));
    plates.forEach((plate) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        expect(plate.cells[y * 16 + x]).toBe(valueAt(plate.column * 16 + x, plate.row * 16 + y));
      }
    });
  });

  it('lists the colours of each plate once, in palette order', () => {
    const mosaic = mosaicOf({ platesWide: 2, platesHigh: 1 }, (x, y) => (x < 16 ? [7, 3, 7, 0][y % 4] ?? 0 : 16));
    const legends = buildPlan(mosaic).map((plate) => plate.legend.map((colour) => colour.id));
    expect(legends).toEqual([['white', 'black', 'yellow'], ['dark-brown']]);
  });
});

describe('billOfMaterials', () => {
  const mosaic = mosaicOf({ platesWide: 2, platesHigh: 2 }, (x, y) => (y === 0 && x < 3 ? 4 : x < 32 && y < 16 ? 0 : 3));

  it('counts tiles per used colour in palette order and the base plates', () => {
    const bom = billOfMaterials(mosaic, 0);
    expect(bom.basePlates).toBe(4);
    expect(bom.tiles.map((line) => [line.colour.id, line.quantity, line.spares])).toEqual([
      ['white', 509, 0], ['black', 512, 0], ['red', 3, 0],
    ]);
    expect(bom.tiles.reduce((sum, line) => sum + line.quantity, 0)).toBe(256 * 4);
  });

  it('rounds spares up, so every used colour gets at least one', () => {
    expect(billOfMaterials(mosaic, 2).tiles.map((line) => line.spares)).toEqual([11, 11, 1]);
    expect(billOfMaterials(mosaic, 5).tiles.map((line) => line.spares)).toEqual([26, 26, 1]);
  });

  it('exports one black base plate per plate of a multi-plate mosaic', () => {
    expect(toBrickLinkXml(billOfMaterials(mosaic, 0))).toContain('<ITEMID>91405</ITEMID><COLOR>11</COLOR><MINQTY>4</MINQTY>');
  });
});

describe('toBrickLinkXml', () => {
  it('lists tiles to buy then black base plates, new, starting with INVENTORY', () => {
    const mosaic = mosaicOf({ platesWide: 1, platesHigh: 1 }, (x) => (x < 6 ? 10 : 0));
    expect(toBrickLinkXml(billOfMaterials(mosaic, 2))).toBe(
      [
        '<INVENTORY>',
        '  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>98138</ITEMID><COLOR>1</COLOR><MINQTY>164</MINQTY><CONDITION>N</CONDITION></ITEM>',
        '  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>98138</ITEMID><COLOR>7</COLOR><MINQTY>98</MINQTY><CONDITION>N</CONDITION></ITEM>',
        '  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>91405</ITEMID><COLOR>11</COLOR><MINQTY>1</MINQTY><CONDITION>N</CONDITION></ITEM>',
        '</INVENTORY>',
        '',
      ].join('\n'),
    );
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black, 1 for white and follows the WCAG weights', () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0);
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 10);
    expect(relativeLuminance(255, 0, 0)).toBeCloseTo(0.2126, 10);
    expect(relativeLuminance(0, 255, 0)).toBeCloseTo(0.7152, 10);
    expect(relativeLuminance(0, 0, 255)).toBeCloseTo(0.0722, 10);
  });
});
