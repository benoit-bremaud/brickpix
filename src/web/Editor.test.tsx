import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import * as renderModule from "./canvas/renderMosaic";
import { computeMosaic, PREVIEW_DEBOUNCE_MS } from "./Editor";
import { stubImage } from "./test-image";

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
    stubImage(64, 48);
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 64, height: 48, close: vi.fn() })));
  });
  afterEach(() => vi.useRealTimers());
}

describe("Editor preview", () => {
  useFakeBrowser();

  it("shows the import prompt and no preview before a photo", () => {
    render(<App />);
    expect(screen.getByText(/Choisissez une photo/)).toBeInTheDocument();
    expect(screen.queryByRole("figure", { name: "Aperçu" })).toBeNull();
  });

  it("draws the preview at once after an import, at the default 3 × 3", async () => {
    stubCanvas();
    const draw = vi.spyOn(renderModule, "renderMosaic");
    render(<App />);
    await importPhoto();
    expect(screen.getByRole("figure", { name: "Aperçu" })).toBeInTheDocument();
    expect(draw).toHaveBeenCalledTimes(1);
    expect(draw.mock.lastCall?.[1].size).toEqual({ platesWide: 3, platesHigh: 3 });
  });

});

describe("Editor debounce", () => {
  useFakeBrowser();

  it("collapses changes made in quick succession into one refresh", async () => {
    stubCanvas();
    render(<App />);
    await importPhoto();
    const draw = vi.spyOn(renderModule, "renderMosaic");
    const width = screen.getByLabelText("Largeur (plaques)");
    fireEvent.change(width, { target: { value: "4" } });
    act(() => vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS - 50));
    fireEvent.change(width, { target: { value: "5" } });
    act(() => vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS - 50));
    expect(draw).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(50));
    expect(draw).toHaveBeenCalledTimes(1);
    expect(draw.mock.lastCall?.[1].size).toEqual({ platesWide: 5, platesHigh: 3 });
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
    expect(screen.getByRole("figure", { name: "Aperçu" })).toBeInTheDocument();
  });

  it("imports a dropped photo", async () => {
    stubCanvas();
    render(<App />);
    const zone = screen.getByText(/Choisissez une photo/).closest("label") as HTMLLabelElement;
    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute("data-over", "true");
    fireEvent.dragLeave(zone);
    await act(async () => {
      fireEvent.drop(zone, { dataTransfer: { files: [new File(["x"], "p.png")] } });
    });
    expect(screen.getByRole("figure", { name: "Aperçu" })).toBeInTheDocument();
  });

  it("ignores an empty selection", async () => {
    render(<App />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    await act(async () => {
      fireEvent.change(input as HTMLInputElement, { target: { files: [] } });
    });
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

});

describe("Editor import order", () => {
  useFakeBrowser();

  it("keeps the latest photo when an older import resolves last", async () => {
    stubCanvas();
    let releaseFirst: (bitmap: ImageBitmap) => void = () => undefined;
    vi.mocked(createImageBitmap)
      .mockReturnValueOnce(new Promise<ImageBitmap>((resolve) => { releaseFirst = resolve; }))
      .mockResolvedValueOnce({ width: 64, height: 48, close: vi.fn() } as unknown as ImageBitmap);
    render(<App />);
    const draw = vi.spyOn(renderModule, "renderMosaic");
    await importPhoto();
    await importPhoto();
    expect(draw).toHaveBeenCalledTimes(1);
    await act(async () => releaseFirst({ width: 64, height: 48, close: vi.fn() } as unknown as ImageBitmap));
    act(() => vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS));
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it("ignores the failure of an import a newer one superseded", async () => {
    stubCanvas();
    let failFirst: (reason: Error) => void = () => undefined;
    vi.mocked(createImageBitmap).mockReturnValueOnce(new Promise<ImageBitmap>((_resolve, reject) => { failFirst = reject; }));
    render(<App />);
    await importPhoto();
    await importPhoto();
    await act(async () => failFirst(new Error("late")));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("figure", { name: "Aperçu" })).toBeInTheDocument();
  });

  it("reports a missing 2D context as a decode error", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<App />);
    await importPhoto();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("Editor kit", () => {
  useFakeBrowser();

  async function orderKit() {
    stubCanvas();
    render(<App />);
    await importPhoto();
    fireEvent.change(screen.getByLabelText("Largeur (plaques)"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Commander mon kit" }));
  }

  it("recomputes the mosaic from the current inputs, before the debounced preview caught up", async () => {
    await orderKit();
    expect(screen.getByRole("region", { name: "Votre kit" })).toBeInTheDocument();
    expect(screen.getAllByRole("figure", { name: /^Plaque/ })).toHaveLength(6);
    expect(screen.queryByRole("figure", { name: "Aperçu" })).toBeNull();
    expect(screen.queryByRole("spinbutton", { name: "Largeur (plaques)" })).toBeNull();
  });

  it("returns to editing on «Retour à l'édition»", async () => {
    await orderKit();
    fireEvent.click(screen.getByRole("button", { name: "Retour à l'édition" }));
    expect(screen.queryByRole("region", { name: "Votre kit" })).toBeNull();
    expect(screen.getByRole("figure", { name: "Aperçu" })).toBeInTheDocument();
  });

  it("returns to editing when a new photo is imported, keeping the size", async () => {
    await orderKit();
    await importPhoto();
    expect(screen.queryByRole("region", { name: "Votre kit" })).toBeNull();
    expect(screen.getByLabelText("Largeur (plaques)")).toHaveValue(2);
  });
});

describe("computeMosaic", () => {
  it("crops, resamples and quantises: a photo black on the left half and white on the right", () => {
    const photo = { width: 64, height: 32, data: new Uint8ClampedArray(64 * 32 * 4) };
    for (let p = 0; p < 64 * 32; p++) photo.data.set(p % 64 < 32 ? [0, 0, 0, 255] : [255, 255, 255, 255], p * 4);
    const mosaic = computeMosaic(photo, { platesWide: 2, platesHigh: 1 }, { dithering: false });
    expect(mosaic.cells).toHaveLength(512);
    expect(mosaic.cells[0]).toBe(3); // black
    expect(mosaic.cells[31]).toBe(0); // white
  });
});

describe("renderMosaic", () => {
  it("does nothing without a 2D context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const canvas = document.createElement("canvas");
    renderModule.renderMosaic(canvas, computeMosaic(PHOTO, { platesWide: 1, platesHigh: 1 }, { dithering: false }));
    expect(canvas.width).toBe(16 * renderModule.STUD_PIXELS);
  });
});
