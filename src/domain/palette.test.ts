import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { ROUND_TILE_PALETTE } from './palette';

const colours = ROUND_TILE_PALETTE.colours;

describe('ROUND_TILE_PALETTE', () => {
  it('matches every row of the palette spec, in order', () => {
    const spec = readFileSync(new URL('../../docs/architecture/specs/palette-round-tiles.md', import.meta.url), 'utf8');
    const rows = [...spec.matchAll(/^\| \d+ \| `([a-z-]+)` \| ([^|]+?) \| `#([0-9A-F]{6})` \| (\d+) \| \d+ \| \d+ \|$/gm)];

    expect(rows).toHaveLength(17);
    expect(colours).toEqual(
      rows.map(([, id, name, hex, brickLink]) => ({
        id,
        name,
        rgb: [0, 2, 4].map((i) => Number.parseInt(String(hex).slice(i, i + 2), 16)),
        brickLinkColorId: Number(brickLink),
      })),
    );
  });

  it('uses unique kebab-case ids, BrickLink ids and RGB values', () => {
    expect(colours.every((c) => /^[a-z]+(-[a-z]+)*$/.test(c.id))).toBe(true);
    expect(new Set(colours.map((c) => c.id)).size).toBe(colours.length);
    expect(new Set(colours.map((c) => c.brickLinkColorId)).size).toBe(colours.length);
    expect(new Set(colours.map((c) => c.rgb.join(','))).size).toBe(colours.length);
  });

  it('keeps every RGB channel an integer in 0-255', () => {
    for (const { rgb } of colours) {
      expect(rgb).toHaveLength(3);
      expect(rgb.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)).toBe(true);
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(ROUND_TILE_PALETTE)).toBe(true);
    expect(Object.isFrozen(colours)).toBe(true);
    expect(colours.every((c) => Object.isFrozen(c) && Object.isFrozen(c.rgb))).toBe(true);
  });
});
