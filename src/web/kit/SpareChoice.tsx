import { SPARE_PERCENTS, type SparePercent } from "../../domain/kit";

const LABELS: Record<SparePercent, string> = { 0: "Aucune", 2: "2 % (conseillé)", 5: "5 %" };

type Props = { readonly value: SparePercent; readonly onChange: (value: SparePercent) => void };

/** «Pièces de rechange»: three native radios, 2 % by default (spec kit.md). */
export function SpareChoice({ value, onChange }: Props) {
  return (
    <fieldset className="spares">
      <legend>Pièces de rechange</legend>
      {SPARE_PERCENTS.map((percent) => (
        <label key={percent}>
          <input type="radio" name="spares" checked={value === percent} onChange={() => onChange(percent)} />
          <span>{LABELS[percent]}</span>
        </label>
      ))}
    </fieldset>
  );
}
