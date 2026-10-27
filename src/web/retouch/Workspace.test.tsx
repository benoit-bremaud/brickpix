import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";
import * as renderModule from "../canvas/renderMosaic";
import * as photoModule from "../canvas/renderPhoto";
import { importPhoto, openToneMore, showMosaic, stubCanvas, tool, useFakeBrowser } from "../test-editor";
import { LONG_PRESS_MS } from "./useFrameGestures";

/** A photo dark on the left half and light on the right: Auto has something to stretch. */
const TWO_TONE = { width: 64, height: 48, data: new Uint8ClampedArray(64 * 48 * 4) };
for (let p = 0; p < 64 * 48; p++) TWO_TONE.data.set(p % 64 < 32 ? [60, 60, 60, 255] : [180, 180, 180, 255], p * 4);

async function start() {
  stubCanvas().getImageData.mockReturnValue(TWO_TONE);
  render(<App />);
  await importPhoto();
  const canvas = screen.getByText("Aperçu de la mosaïque en tuiles rondes.").closest("canvas") as HTMLCanvasElement;
  // Shown at 10 CSS pixels per photo pixel, so a handle is grabbed within 2.4 photo pixels.
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 640, 480));
  return canvas;
}

/** jsdom has no PointerEvent: a MouseEvent carrying pointerId is enough for the handlers. */
class FakePointerEvent extends MouseEvent {
  readonly pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
  }
}

beforeEach(() => vi.stubGlobal("PointerEvent", FakePointerEvent));

const lastCrop = () => vi.mocked(photoModule.renderPhoto).mock.lastCall?.[2];

describe("Retouch toolbar", () => {
  useFakeBrowser();

  it("keeps one panel open at a time and closes it on a second tap", async () => {
    await start();
    expect(screen.getByLabelText("Largeur (plaques)")).toBeInTheDocument();
    tool("Fond");
    expect(screen.queryByLabelText("Largeur (plaques)")).toBeNull();
    expect(screen.getByRole("switch", { name: "Fond uni" })).toBeInTheDocument();
    tool("Fond");
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByRole("button", { name: /Cadrer/ })).toHaveTextContent("3×3");
  });
});

describe("Frame panel", () => {
  useFakeBrowser();

  it("steps the size and keeps it when a new photo resets the retouch", async () => {
    await start();
    fireEvent.click(screen.getByRole("button", { name: "Largeur (plaques) +1" }));
    fireEvent.click(screen.getByRole("button", { name: "Hauteur (plaques) −1" }));
    expect(screen.getByLabelText("Largeur (plaques)")).toHaveValue(4);
    expect(screen.getByLabelText("Hauteur (plaques)")).toHaveValue(2);
    fireEvent.click(screen.getByRole("button", { name: "⇆ Miroir" }));
    await importPhoto();
    expect(screen.getByRole("button", { name: "⇆ Miroir" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Largeur (plaques)")).toHaveValue(4);
  });

  it("turns, zooms and recentres, keeping the turn", async () => {
    vi.spyOn(photoModule, "renderPhoto");
    await start();
    fireEvent.click(screen.getByRole("button", { name: "↻ Pivoter" }));
    expect(lastCrop()).toEqual({ x: 0, y: 8, width: 48, height: 48 }); // the photo is now 48 × 64
    fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "2" } });
    expect(lastCrop()).toEqual({ x: 12, y: 20, width: 24, height: 24 });
    fireEvent.click(screen.getByRole("button", { name: "Recentrer" }));
    expect(lastCrop()).toEqual({ x: 0, y: 8, width: 48, height: 48 });
  });
});

describe("Tone panel", () => {
  useFakeBrowser();

  it("fills the sliders with Auto and resets them with Naturel", async () => {
    await start();
    openToneMore();
    fireEvent.click(screen.getByRole("button", { name: "Auto" }));
    expect(screen.getByLabelText(/Contraste/)).not.toHaveValue("0");
    expect(screen.getByLabelText(/Saturation/)).toHaveValue("15");
    fireEvent.click(screen.getByRole("button", { name: "Naturel" }));
    expect(screen.getByRole("button", { name: "Naturel" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/Contraste/)).toHaveValue("0");
  });

  it("applies a mood and the sharpen slider", async () => {
    await start();
    openToneMore();
    fireEvent.click(screen.getByRole("button", { name: "N&B" }));
    expect(screen.getByLabelText(/Saturation/)).toHaveValue("-100");
    fireEvent.change(screen.getByLabelText(/Netteté/), { target: { value: "40" } });
    expect(screen.getByLabelText(/Netteté/)).toHaveValue("40");
    fireEvent.click(screen.getByRole("button", { name: /Plus/ }));
    expect(screen.queryByLabelText(/Netteté/)).toBeNull();
  });
});

describe("Background panel", () => {
  useFakeBrowser();

  it("shows the tolerance only once the switch is on", async () => {
    await start();
    tool("Fond");
    expect(screen.queryByLabelText(/Tolérance/)).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Fond uni" }));
    fireEvent.change(screen.getByLabelText(/Tolérance/), { target: { value: "15" } });
    expect(screen.getByLabelText(/Tolérance/)).toHaveValue("15");
  });
});

describe("Canvas gestures while framing", () => {
  useFakeBrowser();

  it("pans with the arrow keys and zooms with + and − and the wheel", async () => {
    vi.spyOn(photoModule, "renderPhoto");
    const canvas = await start();
    fireEvent.keyDown(canvas, { key: "+" });
    expect(lastCrop()).toEqual({ x: 13, y: 5, width: 38, height: 38 });
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(lastCrop()?.x).toBe(14);
    fireEvent.keyDown(canvas, { key: "-" });
    fireEvent.keyDown(canvas, { key: "x" });
    expect(lastCrop()?.width).toBe(48);
    fireEvent.wheel(canvas, { deltaY: -1 });
    expect(lastCrop()?.width).toBe(38);
  });

  it("pans by dragging and stretches the size by a handle", async () => {
    vi.spyOn(photoModule, "renderPhoto");
    const canvas = await start();
    fireEvent.keyDown(canvas, { key: "+" }); // frame 38 × 38 at (13, 5): room to move
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 320, clientY: 240 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 300, clientY: 240 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    expect(lastCrop()?.x).toBe(15);
    fireEvent.pointerDown(canvas, { pointerId: 2, clientX: 530, clientY: 240 }); // near the right handle at x = 51
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 660, clientY: 240 });
    fireEvent.pointerUp(canvas, { pointerId: 2 });
    expect(screen.getByLabelText("Largeur (plaques)")).toHaveValue(4);
  });

  it("zooms with a two-finger pinch", async () => {
    vi.spyOn(photoModule, "renderPhoto");
    const canvas = await start();
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 200, clientY: 240 });
    fireEvent.pointerDown(canvas, { pointerId: 2, clientX: 300, clientY: 240 });
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 400, clientY: 240 });
    expect(lastCrop()?.width).toBe(24);
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 2 });
  });
});

describe("Before / after", () => {
  useFakeBrowser();

  it("shows the framed photo on a long press and the mosaic again on release", async () => {
    const photo = vi.spyOn(photoModule, "renderPhoto");
    const canvas = await start();
    showMosaic();
    expect(screen.getByText(/Appui long/)).toBeInTheDocument();
    const mosaic = vi.spyOn(renderModule, "renderMosaic");
    fireEvent.pointerDown(canvas, { pointerId: 1 });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    expect(photo.mock.lastCall?.[3]).toBe("before");
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    expect(mosaic).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Appui long/)).toBeNull();
  });

  it("shows the framed photo while Space is held", async () => {
    const photo = vi.spyOn(photoModule, "renderPhoto");
    const canvas = await start();
    showMosaic();
    fireEvent.keyDown(canvas, { key: " " });
    expect(photo.mock.lastCall?.[3]).toBe("before");
    fireEvent.keyDown(canvas, { key: "Enter" });
    fireEvent.keyUp(canvas, { key: " " });
    expect(screen.getByRole("figure", { name: "Aperçu" })).toBeInTheDocument();
  });
});
