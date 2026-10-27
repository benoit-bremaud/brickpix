import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import * as renderModule from "./canvas/renderMosaic";
import { computeMosaic, PREVIEW_DEBOUNCE_MS } from "./Editor";

const PHOTO = { width: 64, height: 48, data: new Uint8ClampedArray(64 * 48 * 4).fill(255) };

function stubCanvas() {
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => PHOTO),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: "",
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  return context;
}

async function importPhoto(file = new File(["x"], "photo.png", { type: "image/png" })) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) throw new Error("no file input");
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
}

function useFakeBrowser() {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 64, height: 48, close: vi.fn() })));
  });
  afterEach(() => vi.useRealTimers());
}

describe("Editor preview", () => {
  useFakeBrowser();

  it("shows the import prompt and no preview before a photo", () => {
    render(<App />);
    expect(screen.getByText(/Choisissez une photo/)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Aperçu/ })).toBeNull();
  });

  it("draws the preview at once after an import", async () => {
    const context = stubCanvas();
    render(<App />);
    await importPhoto();
    expect(screen.getByRole("img", { name: /Aperçu/ })).toBeInTheDocument();
    expect(context.arc).toHaveBeenCalledTimes(48 * 48);
  });

  it("refreshes the preview once, debounced, after size and dithering changes", async () => {
    stubCanvas();
    render(<App />);
    await importPhoto();
    const draw = vi.spyOn(renderModule, "renderMosaic");
    fireEvent.change(screen.getByLabelText("Largeur (plaques)"), { target: { value: "4" } });
    fireEvent.click(screen.getByLabelText("Tramage"));
    expect(draw).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS));
    expect(draw).toHaveBeenCalledTimes(1);
    expect(draw.mock.lastCall?.[1].size).toEqual({ platesWide: 4, platesHigh: 3 });
  });
});

describe("Editor controls", () => {
  useFakeBrowser();

  it.each([
    ["99", "8"],
    ["0", "1"],
    ["", "1"],
  ])("clamps a plate count of %j to %s", (typed, shown) => {
    render(<App />);
    const height = screen.getByLabelText("Hauteur (plaques)");
    fireEvent.change(height, { target: { value: typed } });
    expect(height).toHaveValue(Number(shown));
  });
});

describe("Editor import", () => {
  useFakeBrowser();

  it("shows an error and keeps the current photo when decoding fails", async () => {
    stubCanvas();
    render(<App />);
    await importPhoto();
    vi.mocked(createImageBitmap).mockRejectedValueOnce(new Error("bad"));
    await importPhoto();
    expect(screen.getByRole("alert")).toHaveTextContent("Impossible de lire cette image");
    expect(screen.getByRole("img", { name: /Aperçu/ })).toBeInTheDocument();
  });

  it("imports a dropped photo", async () => {
    stubCanvas();
    render(<App />);
    const zone = screen.getByText(/Choisissez une photo/);
    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute("data-over", "true");
    fireEvent.dragLeave(zone);
    await act(async () => {
      fireEvent.drop(zone, { dataTransfer: { files: [new File(["x"], "p.png")] } });
    });
    expect(screen.getByRole("img", { name: /Aperçu/ })).toBeInTheDocument();
  });

  it("ignores an empty selection", async () => {
    render(<App />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    await act(async () => {
      fireEvent.change(input as HTMLInputElement, { target: { files: [] } });
    });
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it("reports a missing 2D context as a decode error", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<App />);
    await importPhoto();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("computeMosaic", () => {
  it("maps a white photo to white tiles over the whole stud grid", () => {
    const mosaic = computeMosaic(PHOTO, { platesWide: 2, platesHigh: 1 }, false);
    expect(mosaic.cells).toHaveLength(512);
    expect(mosaic.cells.every((cell) => cell === 0)).toBe(true);
  });
});

describe("renderMosaic", () => {
  it("does nothing without a 2D context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const canvas = document.createElement("canvas");
    renderModule.renderMosaic(canvas, computeMosaic(PHOTO, { platesWide: 1, platesHigh: 1 }, false));
    expect(canvas.width).toBe(16 * renderModule.STUD_PIXELS);
  });
});
