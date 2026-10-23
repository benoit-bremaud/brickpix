import { describe, expect, it } from 'vitest';

import { ROUND_TILE_PALETTE } from './palette';

const colours = ROUND_TILE_PALETTE.colours;

describe('ROUND_TILE_PALETTE', () => {
  it('holds the 17 colours of the spec in palette order', () => {
    expect(colours.map((c) => c.id)).toEqual([
      'white', 'light-bluish-gray', 'dark-bluish-gray', 'black', 'red', 'orange',
      'bright-light-orange', 'yellow', 'lime', 'medium-azure', 'blue', 'bright-pink', 'tan',
      'dark-tan', 'medium-nougat', 'reddish-brown', 'dark-brown',
    ]);
  });

  it('uses unique kebab-case ids, BrickLink ids, element ids and RGB values', () => {
    expect(colours.every((c) => /^[a-z]+(-[a-z]+)*$/.test(c.id))).toBe(true);
    expect(new Set(colours.map((c) => c.id)).size).toBe(colours.length);
    expect(new Set(colours.map((c) => c.brickLinkColorId)).size).toBe(colours.length);
    expect(new Set(colours.map((c) => c.legoElementId)).size).toBe(colours.length);
    expect(new Set(colours.map((c) => c.rgb.join(','))).size).toBe(colours.length);
  });

  it('keeps every RGB channel an integer in 0-255 and every element id numeric', () => {
    for (const { rgb, legoElementId } of colours) {
      expect(rgb).toHaveLength(3);
      expect(rgb.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)).toBe(true);
      expect(legoElementId).toMatch(/^\d{7}$/);
    }
  });

  it('matches spec rows for anchor colours', () => {
    expect(colours[0]).toEqual({ id: 'white', name: 'White', rgb: [255, 255, 255], brickLinkColorId: 1, legoElementId: '4646844' });
    expect(colours[16]).toEqual({ id: 'dark-brown', name: 'Dark Brown', rgb: [53, 33, 0], brickLinkColorId: 120, legoElementId: '6322813' });
  });

  it('is frozen', () => {
    expect(Object.isFrozen(ROUND_TILE_PALETTE)).toBe(true);
    expect(Object.isFrozen(colours)).toBe(true);
    expect(colours.every((c) => Object.isFrozen(c))).toBe(true);
  });
});
