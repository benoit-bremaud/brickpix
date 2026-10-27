import { afterEach, describe, expect, it, vi } from "vitest";

import { decodeFile, MAX_DECODE_SIDE } from "./imageIO";

function bitmap(width: number, height: number) {
  return { width, height, close: vi.fn() };
}

function stubContext() {
  const getImageData = vi.fn((_x: number, _y: number, width: number, height: number) => ({
    width,
    height,
    data: new Uint8ClampedArray(4),
  }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    getImageData,
  } as unknown as CanvasRenderingContext2D);
  return getImageData;
}

describe("decodeFile", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps a photo whose longest side fits", async () => {
    const small = bitmap(800, 600);
    const create = vi.fn(async () => small);
    vi.stubGlobal("createImageBitmap", create);
    stubContext();
    const image = await decodeFile(new File(["x"], "p.png"));
    expect([image.width, image.height]).toEqual([800, 600]);
    expect(create).toHaveBeenCalledTimes(1);
    expect(small.close).toHaveBeenCalled();
  });

  it("downscales a large photo to MAX_DECODE_SIDE on its longest side", async () => {
    const full = bitmap(8000, 6000);
    const create = vi.fn(async (_source: unknown, options?: { resizeWidth: number; resizeHeight: number }) =>
      options === undefined ? full : bitmap(options.resizeWidth, options.resizeHeight),
    );
    vi.stubGlobal("createImageBitmap", create);
    stubContext();
    const image = await decodeFile(new File(["x"], "p.jpg"));
    expect([image.width, image.height]).toEqual([MAX_DECODE_SIDE, 1536]);
    expect(full.close).toHaveBeenCalled();
  });
});
