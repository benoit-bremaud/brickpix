import { describe, expect, it, vi } from "vitest";

import { stubImage } from "../test-image";
import { decodeFile, MAX_DECODE_SIDE } from "./imageIO";

function stubContext() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(4),
    })),
  } as unknown as CanvasRenderingContext2D);
}

function stubBitmaps(width: number, height: number) {
  const create = vi.fn(async (_file: unknown, options?: { resizeWidth: number; resizeHeight: number }) => ({
    width: options?.resizeWidth ?? width,
    height: options?.resizeHeight ?? height,
    close: vi.fn(),
  }));
  vi.stubGlobal("createImageBitmap", create);
  return create;
}

describe("decodeFile", () => {
  it("decodes a photo whose longest side fits at its own size", async () => {
    stubImage(800, 600);
    const create = stubBitmaps(800, 600);
    stubContext();
    const image = await decodeFile(new File(["x"], "p.png"));
    expect([image.width, image.height]).toEqual([800, 600]);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.lastCall?.[1]).toBeUndefined();
  });

  it("decodes a large photo straight to MAX_DECODE_SIDE, never at full size", async () => {
    stubImage(8000, 6000);
    const create = stubBitmaps(8000, 6000);
    stubContext();
    const image = await decodeFile(new File(["x"], "p.jpg"));
    expect([image.width, image.height]).toEqual([MAX_DECODE_SIDE, 1536]);
    expect(create).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local");
  });

  it("rejects a file the browser cannot read", async () => {
    stubImage(0, 0, true);
    const create = stubBitmaps(0, 0);
    await expect(decodeFile(new File(["x"], "p.txt"))).rejects.toThrow("Not a decodable image.");
    expect(create).not.toHaveBeenCalled();
  });
});
