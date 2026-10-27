import { vi } from "vitest";

/**
 * Stubs the browser image boundary jsdom lacks: `Image` reports the given natural size (or fails
 * when `fail` is set) and blob URLs are fake.
 */
export function stubImage(width: number, height: number, fail = false): void {
  class FakeImage {
    naturalWidth = width;
    naturalHeight = height;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_url: string) {
      queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()));
    }
  }
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local");
  vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
}
