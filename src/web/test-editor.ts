import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { stubImage } from "./test-image";

/** Test wiring shared by the editor and retouch tests: Canvas, decode and import doubles. */
export const PHOTO = { width: 64, height: 48, data: new Uint8ClampedArray(64 * 48 * 4).fill(255) };

export function stubCanvas() {
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => PHOTO),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn((width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) })),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  return context;
}

/** Opens a retouch tool (or closes it when it is open). */
export function tool(name: "Cadrer" | "Ambiance" | "Fond") {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));
}

/** Closes «Cadrer», opened after an import, so the preview shows the mosaic. */
export function showMosaic() {
  tool("Cadrer");
}

/** Opens «Ambiance › Plus», where the sliders and the dithering toggle live. */
export function openToneMore() {
  tool("Ambiance");
  fireEvent.click(screen.getByRole("button", { name: /Plus/ }));
}

export async function importPhoto(file = new File(["x"], "photo.png", { type: "image/png" })) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) throw new Error("no file input");
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
}

export function useFakeBrowser() {
  beforeEach(() => {
    vi.useFakeTimers();
    stubImage(64, 48);
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 64, height: 48, close: vi.fn() })));
  });
  afterEach(() => vi.useRealTimers());
}

