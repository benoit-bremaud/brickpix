import { describe, expect, it } from "vitest";

import { MAX_ZOOM, NEUTRAL_FRAMING } from "../../domain/crop";
import { handleAt, pan, stretch, zoomBy } from "./frameGeometry";

const crop = { x: 100, y: 50, width: 300, height: 200 };
const image = { width: 600, height: 400 };
const size = { platesWide: 3, platesHigh: 2 };

describe("handleAt", () => {
  it.each([
    [{ x: 100, y: 50 }, { x: -1, y: -1 }],
    [{ x: 405, y: 150 }, { x: 1, y: 0 }],
    [{ x: 250, y: 248 }, { x: 0, y: 1 }],
  ])("finds the handle near %j", (point, handle) => {
    expect(handleAt(crop, point, 10)).toEqual(handle);
  });

  it("finds none in the middle of the frame", () => {
    expect(handleAt(crop, { x: 250, y: 150 }, 10)).toBeUndefined();
  });
});

describe("pan", () => {
  const zoomed = { ...NEUTRAL_FRAMING, zoom: 2 };

  it("moves the centre by the delta", () => {
    expect(pan(zoomed, image, size, { x: 60, y: -40 })).toMatchObject({ centreX: 0.6, centreY: 0.4 });
  });

  it("snaps the centre to where the crop stops at the image edge", () => {
    expect(pan(zoomed, image, size, { x: 10_000, y: 0 })).toMatchObject({ centreX: 0.75, centreY: 0.5 });
  });
});

describe("zoomBy", () => {
  it("multiplies the zoom within 1..MAX_ZOOM", () => {
    expect(zoomBy(NEUTRAL_FRAMING, 2).zoom).toBe(2);
    expect(zoomBy(NEUTRAL_FRAMING, 0.5).zoom).toBe(1);
    expect(zoomBy({ ...NEUTRAL_FRAMING, zoom: 6 }, 2).zoom).toBe(MAX_ZOOM);
  });
});

describe("stretch", () => {
  it("changes only the axes the handle moves", () => {
    expect(stretch(size, { x: 1, y: 0 }, crop, { x: 100, y: 999 })).toEqual({ platesWide: 4, platesHigh: 2 });
    expect(stretch(size, { x: -1, y: -1 }, crop, { x: 100, y: -200 })).toEqual({ platesWide: 2, platesHigh: 4 });
  });
});
