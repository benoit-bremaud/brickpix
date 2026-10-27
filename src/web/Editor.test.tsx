import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { NEUTRAL_RETOUCH } from "../domain/retouch";
import * as renderModule from "./canvas/renderMosaic";
import * as photoModule from "./canvas/renderPhoto";
import { computeMosaic } from "./chain";
import { importPhoto, openToneMore, PHOTO, showMosaic, stubCanvas, useFakeBrowser } from "./test-editor";
import { PREVIEW_DEBOUNCE_MS } from "./usePreview";

describe("Editor preview", () => {
  useFakeBrowser();

  it("shows the import prompt and no preview before a photo", () => {
    render(<App />);
    expect(screen.getByText(/Choisissez une photo/)).toBeInTheDocument();
    expect(screen.queryByRole("figure", { name: "Aperçu" })).toBeNull();
  });

  it("opens «Cadrer» after an import and draws the photo with its frame at once", async () => {
    stubCanvas();
    const photo = vi.spyOn(photoModule, "renderPhoto");
    const mosaic = vi.spyOn(renderModule, "renderMosaic");
    render(<App />);
    await importPhoto();
    expect(screen.getByRole("figure", { name: "Aperçu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadrer/ })).toHaveAttribute("aria-pressed", "true");
    expect(photo).toHaveBeenCalledTimes(1);
    expect(photo.mock.lastCall?.[3]).toBe("frame");
    expect(photo.mock.lastCall?.[2]).toEqual({ x: 8, y: 0, width: 48, height: 48 });
    expect(mosaic).not.toHaveBeenCalled();
  });

  it("draws the mosaic at once when «Cadrer» closes, at the default 3 × 3", async () => {
    stubCanvas();
    render(<App />);
    await importPhoto();
    const draw = vi.spyOn(renderModule, "renderMosaic");
    showMosaic();
    expect(draw).toHaveBeenCalledTimes(1);
    expect(draw.mock.lastCall?.[1].size).toEqual({ platesWide: 3, platesHigh: 3 });
    expect(screen.getByText(/^3 × 3 plaques · 48 × 48 tenons · 2\s?304 tuiles$/)).toBeInTheDocument();
  });

});

describe("Editor debounce", () => {
  useFakeBrowser();

  it("collapses changes made in quick succession into one refresh", async () => {
    stubCanvas();
    render(<App />);
    await importPhoto();
    openToneMore();
    const draw = vi.spyOn(renderModule, "renderMosaic");
    const brightness = screen.getByLabelText(/Luminosité/);
    fireEvent.change(brightness, { target: { value: "10" } });
    act(() => vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS - 50));
    fireEvent.change(brightness, { target: { value: "20" } });
    act(() => vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS - 50));
    expect(draw).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(50));
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it("refreshes the preview once, debounced, after tone and dithering changes", async () => {
    stubCanvas();
    render(<App />);
    await importPhoto();
    openToneMore();
    const draw = vi.spyOn(renderModule, "renderMosaic");
    fireEvent.change(screen.getByLabelText(/Contraste/), { target: { value: "30" } });
    fireEvent.click(screen.getByLabelText("Tramage"));
    expect(draw).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS));
    expect(draw).toHaveBeenCalledTimes(1);
  });
});

describe("Editor debounce and kit", () => {
  useFakeBrowser();

  it("drops a pending preview when the kit is ordered", async () => {
    stubCanvas();
    render(<App />);
    await importPhoto();
    openToneMore();
    const draw = vi.spyOn(renderModule, "renderMosaic");
    fireEvent.change(screen.getByLabelText(/Saturation/), { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Commander mon kit" }));
    act(() => vi.runAllTimers());
    expect(screen.getByRole("heading", { name: "Votre kit" })).toBeInTheDocument();
    expect(draw).not.toHaveBeenCalled();
  });
});

describe("Editor controls", () => {
  useFakeBrowser();

  it.each([
    ["99", "8"],
    ["0", "1"],
    ["", "1"],
  ])("clamps a plate count of %j to %s", async (typed, shown) => {
    stubCanvas();
    render(<App />);
    await importPhoto();
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
    const draw = vi.spyOn(photoModule, "renderPhoto");
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

describe("Editor kit busy state", () => {
  useFakeBrowser();

  it("shows a busy message and disables the button until the kit is ready", async () => {
    stubCanvas();
    render(<App />);
    await importPhoto();
    const controls = screen.getByLabelText("Largeur (plaques)").closest(".controls");
    const dropzone = screen.getByText(/Choisissez une photo/).closest("label");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(controls).not.toHaveAttribute("inert");
    expect(dropzone).not.toHaveAttribute("inert");

    fireEvent.click(screen.getByRole("button", { name: "Commander mon kit" }));
    expect(screen.getByRole("status")).toHaveTextContent("Préparation du kit…");
    expect(screen.getByRole("button", { name: "Commander mon kit" })).toBeDisabled();
    expect(controls).toHaveAttribute("inert");
    expect(dropzone).toHaveAttribute("inert");

    act(() => vi.advanceTimersToNextFrame()); // the message is painted, the computation still waits
    expect(screen.getByRole("status")).toHaveTextContent("Préparation du kit…");
    expect(screen.queryByRole("region", { name: "Votre kit" })).toBeNull();
    act(() => vi.runOnlyPendingTimers()); // the setTimeout(0) runs the computation
    expect(screen.getByRole("region", { name: "Votre kit" })).toBeInTheDocument();
    expect(controls).not.toHaveAttribute("inert");
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
    act(() => vi.runAllTimers());
  }

  it("recomputes the mosaic from the current inputs, before the debounced preview caught up", async () => {
    await orderKit();
    expect(screen.getByRole("region", { name: "Votre kit" })).toBeInTheDocument();
    expect(screen.getAllByRole("figure", { name: /^Plaque/ })).toHaveLength(6);
    expect(screen.queryByRole("figure", { name: "Aperçu" })).toBeNull();
    expect(screen.queryByRole("spinbutton", { name: "Largeur (plaques)" })).toBeNull();
  });

  it("returns to editing on «Retour à l'édition», focus back on the order button", async () => {
    await orderKit();
    fireEvent.click(screen.getByRole("button", { name: "Retour à l'édition" }));
    act(() => vi.runAllTimers());
    expect(screen.queryByRole("region", { name: "Votre kit" })).toBeNull();
    expect(screen.getByRole("figure", { name: "Aperçu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Commander mon kit" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Commander mon kit" })).toBeEnabled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("returns to editing when a new photo is imported, keeping the size", async () => {
    await orderKit();
    await importPhoto();
    expect(screen.queryByRole("region", { name: "Votre kit" })).toBeNull();
    expect(screen.getByLabelText("Largeur (plaques)")).toHaveValue(2);
  });
});

describe("Editor kit dithering", () => {
  useFakeBrowser();

  it("forwards the dithering choice: a mid-grey photo needs more colours dithered", async () => {
    const grey = { width: 64, height: 48, data: new Uint8ClampedArray(64 * 48 * 4).fill(140) };
    const coloursOrdered = async (dithering: boolean) => {
      stubCanvas().getImageData.mockReturnValue(grey);
      const view = render(<App />);
      await importPhoto();
      if (dithering) {
        openToneMore();
        fireEvent.click(screen.getByLabelText("Tramage"));
      }
      fireEvent.click(screen.getByRole("button", { name: "Commander mon kit" }));
      act(() => vi.runAllTimers());
      const rows = screen.getByRole("table").querySelectorAll("tbody tr").length;
      view.unmount();
      return rows;
    };
    const plain = await coloursOrdered(false);
    expect(await coloursOrdered(true)).toBeGreaterThan(plain);
  });
});

describe("computeMosaic", () => {
  it("crops, resamples and quantises: a photo black on the left half and white on the right", () => {
    const photo = { width: 64, height: 32, data: new Uint8ClampedArray(64 * 32 * 4) };
    for (let p = 0; p < 64 * 32; p++) photo.data.set(p % 64 < 32 ? [0, 0, 0, 255] : [255, 255, 255, 255], p * 4);
    const mosaic = computeMosaic(photo, { platesWide: 2, platesHigh: 1 }, NEUTRAL_RETOUCH, { dithering: false });
    expect(mosaic.cells).toHaveLength(512);
    expect(mosaic.cells[0]).toBe(3); // black
    expect(mosaic.cells[31]).toBe(0); // white
  });
});

describe("renderMosaic", () => {
  it("does nothing without a 2D context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const canvas = document.createElement("canvas");
    renderModule.renderMosaic(canvas, computeMosaic(PHOTO, { platesWide: 1, platesHigh: 1 }, NEUTRAL_RETOUCH, { dithering: false }));
    expect(canvas.width).toBe(16 * renderModule.STUD_PIXELS);
  });
});
