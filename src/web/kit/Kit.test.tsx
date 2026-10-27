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

function totalsOf(header: string) {
  const row = screen.getByRole("rowheader", { name: header }).closest("tr");
  return row === null ? undefined : within(row).getAllByRole("cell").map((cell) => cell.textContent);
}

function rowOf(name: string) {
  const row = screen.getByRole("cell", { name: new RegExp(name) }).closest("tr");
  if (row === null) throw new Error(`no row ${name}`);
  return within(row).getAllByRole("cell").map((cell) => cell.textContent?.trim());
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
    expect(rowOf("White")).toEqual(["1", "White", "255", "261"]);
    expect(rowOf("Red")).toEqual(["5", "Red", "1", "2"]);
    expect(rowOf("Blue")).toEqual(["11", "Blue", "256", "262"]);
    expect(totalsOf("Tuiles rondes 1 × 1")).toEqual(["512", "525"]);
    expect(totalsOf("Plaques de base 16 × 16")).toEqual(["2", "2"]);
  });

  it("wraps the bill in a scroll region named by its caption", () => {
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    const region = screen.getByRole("region", { name: "Liste des pièces" });
    expect(within(region).getByRole("table", { name: "Liste des pièces" })).toBeInTheDocument();
    expect(region).toHaveAttribute("tabindex", "0"); // keyboard scrolling in WebKit
  });

  it("focuses its heading when it opens", () => {
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Votre kit" })).toHaveFocus();
  });
});

describe("Kit spare rate", () => {
  useFakeBrowser();

  it.each([
    ["Aucune", "255", "512"],
    ["5 %", "268", "539"],
  ])("updates the table and the copied XML for «%s»", async (option, whiteToBuy, total) => {
    writeText.mockResolvedValue(undefined);
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: option }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copier la liste BrickLink" })));

    expect(rowOf("White")).toEqual(["1", "White", "255", whiteToBuy]);
    expect(totalsOf("Tuiles rondes 1 × 1")?.[1]).toBe(total);
    expect(writeText.mock.lastCall?.[0]).toContain(`<COLOR>1</COLOR><MINQTY>${whiteToBuy}</MINQTY>`);
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
    expect(within(left).getAllByRole("listitem").map((item) => item.textContent?.trim())).toEqual(["1 — White", "5 — Red"]);
    expect(within(right).getAllByRole("listitem").map((item) => item.textContent?.trim())).toEqual(["11 — Blue"]);
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

  it("downloads the XML through a revoked local Blob URL under the plates file name", async () => {
    vi.useFakeTimers();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockReturnValue(undefined);
    render(<Kit mosaic={makeMosaic()} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Télécharger la liste BrickLink" }));

    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe("brickpix-2x1-plaques-bricklink.xml");
    expect(link.href).toBe("blob:local");
    const blob = vi.mocked(URL.createObjectURL).mock.lastCall?.[0] as Blob;
    expect(blob.type).toBe("application/xml");
    expect(await blob.text()).toMatch(/^<INVENTORY>\n.*<\/INVENTORY>\n$/s);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local");
    vi.useRealTimers();
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
