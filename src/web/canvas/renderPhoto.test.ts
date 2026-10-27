// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { stubCanvas } from "../test-editor";
import { renderPhoto } from "./renderPhoto";

describe("renderPhoto", () => {
  it("paints the white matte under the photo, as the mosaic composites transparency", () => {
    const context = stubCanvas();
    const canvas = document.createElement("canvas");
    const image = { width: 4, height: 2, data: new Uint8ClampedArray(4 * 2 * 4) }; // fully transparent
    renderPhoto(canvas, image, { x: 0, y: 0, width: 2, height: 2 }, "before");
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 2, 2);
    const matte = context.fillRect.mock.invocationCallOrder[0] ?? Infinity;
    expect(matte).toBeLessThan(context.drawImage.mock.invocationCallOrder[0] ?? 0);
  });
});
