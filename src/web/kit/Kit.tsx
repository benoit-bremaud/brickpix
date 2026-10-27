import { useEffect, useRef, useState } from "react";

import { toBrickLinkXml } from "../../domain/brickLinkXml";
import { billOfMaterials, buildPlan, DEFAULT_SPARE_PERCENT, type SparePercent } from "../../domain/kit";
import type { Mosaic } from "../../domain/mosaic";
import { BillTable } from "./BillTable";
import { KitActions } from "./KitActions";
import { PlateGrid } from "./PlateGrid";
import { SpareChoice } from "./SpareChoice";

/** `brickpix-3x3-plaques-bricklink.xml` (spec kit.md). */
export function xmlFileName(mosaic: Mosaic): string {
  return `brickpix-${mosaic.size.platesWide}x${mosaic.size.platesHigh}-plaques-bricklink.xml`;
}

type Props = { readonly mosaic: Mosaic; readonly onBack: () => void };

/** The «Commander mon kit» screen: actions, spares, bill of materials and the plan per plate. */
export function Kit({ mosaic, onBack }: Props) {
  const [spares, setSpares] = useState<SparePercent>(DEFAULT_SPARE_PERCENT);
  const bom = billOfMaterials(mosaic, spares);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []); // the order button is now hidden (WCAG 2.4.3)
  return (
    <section className="kit" aria-labelledby="kit-title">
      <h2 id="kit-title" ref={title} tabIndex={-1}>Votre kit</h2>
      <KitActions xml={toBrickLinkXml(bom)} fileName={xmlFileName(mosaic)} onBack={onBack} />
      <SpareChoice value={spares} onChange={setSpares} />
      <BillTable bom={bom} palette={mosaic.palette} />
      {buildPlan(mosaic).map((plate, index) => (
        <PlateGrid key={`${plate.column}-${plate.row}`} plate={plate} number={index + 1} palette={mosaic.palette} />
      ))}
    </section>
  );
}
