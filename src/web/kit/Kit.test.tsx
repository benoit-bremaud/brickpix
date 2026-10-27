import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Mosaic } from "../../domain/mosaic";
import { ROUND_TILE_PALETTE } from "../../domain/palette";
import { Kit, xmlFileName } from "./Kit";

/** 2 × 1 plates: the left plate white with one red stud, the right plate blue. */
function makeMosaic(): Mosaic {
  const cells = new Uint8Array(32 * 16);
  cells.forEach((_, i) => (cells[i] = i % 32 < 16 ? 0 : 10));
  cells[0] = 4;
  return { size: { platesWide: 2, platesHigh: 1 }, palette: ROUND_TILE_PALETTE, cells };
}

function rowOf(name: string) {
  const row = screen.getByRole("cell", { name: new RegExp(name) }).closest("tr");
  if (row === null) throw new Error(`no row ${name}`);
  return within(row).getAllByRole("cell").map((cell) => cell.textContent);
}

const writeText = vi.fn();

/** The browser boundaries of the kit: clipboard and Blob URLs. */
function useFakeBrowser() {
  beforeEach(() => {
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    writeText.mockReset();
  });
}

describe("Kit bill of materials", () => {
  it("lists tiles to place and to buy with 2 % spares by default, and the base plates", () => {
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "2 % (conseillé)" })).toBeChecked();
    expect(rowOf("White")).toEqual(["1", " White", "255", "261"]);
    expect(rowOf("Red")).toEqual(["5", " Red", "1", "2"]);
    expect(rowOf("Blue")).toEqual(["11", " Blue", "256", "262"]);
    expect(screen.getByRole("rowheader", { name: "Plaques de base 16 × 16" }).closest("tr")).toHaveTextContent("22");
  });

  it("updates the quantities to buy when the spare rate changes", () => {
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Aucune" }));

    expect(rowOf("White")).toEqual(["1", " White", "255", "255"]);
  });

});

describe("Kit plan", () => {
  it("draws each plate in reading order with numbered coloured studs and its legend", () => {
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    const left = screen.getByRole("figure", { name: "Plaque 1 (colonne 1, rangée 1)" });
    const right = screen.getByRole("figure", { name: "Plaque 2 (colonne 2, rangée 1)" });
    const firstStud = left.querySelector(".stud");
    expect(firstStud).toHaveTextContent("5");
    expect(firstStud).toHaveAttribute("data-ink", "light");
    expect(left.querySelectorAll(".stud")).toHaveLength(256);
    expect(within(left).getAllByRole("listitem").map((item) => item.textContent)).toEqual([" 1 — White", " 5 — Red"]);
    expect(within(right).getAllByRole("listitem").map((item) => item.textContent)).toEqual([" 11 — Blue"]);
  });

});

describe("Kit export", () => {
  useFakeBrowser();

  it("copies the BrickLink XML to the clipboard", async () => {
    writeText.mockResolvedValue(undefined);
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copier la liste BrickLink" })));

    expect(writeText.mock.lastCall?.[0]).toMatch(/^<INVENTORY>\n.*<ITEMID>98138<\/ITEMID><COLOR>1<\/COLOR><MINQTY>261</s);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("tells the buyer to download when the copy is refused", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copier la liste BrickLink" })));

    expect(screen.getByRole("alert")).toHaveTextContent("Copie impossible, utilisez Télécharger.");
  });

  it("downloads the XML through a revoked local Blob URL under the plates file name", () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockReturnValue(undefined);
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Télécharger la liste BrickLink" }));

    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe("brickpix-2x1-plaques-bricklink.xml");
    expect(link.href).toBe("blob:local");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local");
  });

});

describe("Kit navigation", () => {
  it("prints and goes back on request", () => {
    const print = vi.spyOn(window, "print").mockReturnValue(undefined);
    const onBack = vi.fn();
    render(<Kit mosaic={makeMosaic()} onBack={onBack} />);

    fireEvent.click(screen.getByRole("button", { name: "Imprimer le plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Retour à l'édition" }));

    expect(print).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("names the file after the size in plates", () => {
    expect(xmlFileName({ ...makeMosaic(), size: { platesWide: 3, platesHigh: 3 } })).toBe("brickpix-3x3-plaques-bricklink.xml");
  });
});
