import type { MosaicSize } from "../../domain/mosaic";

/** The three retouch tools of spec retouch.md; one panel is open at a time. */
export type Tool = "frame" | "tone" | "background";

const TOOLS: readonly { readonly id: Tool; readonly label: string; readonly icon: string }[] = [
  { id: "frame", label: "Cadrer", icon: "⬚" },
  { id: "tone", label: "Ambiance", icon: "◐" },
  { id: "background", label: "Fond", icon: "◌" },
];

type Props = {
  tool: Tool | undefined;
  size: MosaicSize;
  onTool: (tool: Tool | undefined) => void;
};

/** The retouch toolbar: a tap opens a tool's panel, a second tap closes it. */
export function Toolbar({ tool, size, onTool }: Readonly<Props>) {
  return (
    <fieldset className="toolbar">
      <legend className="visually-hidden">Retouche</legend>
      {TOOLS.map(({ id, label, icon }) => (
        <button key={id} type="button" aria-pressed={tool === id} onClick={() => onTool(tool === id ? undefined : id)}>
          <span aria-hidden="true">{icon}</span> {label}
          {id === "frame" && <small> {size.platesWide}×{size.platesHigh}</small>}
        </button>
      ))}
    </fieldset>
  );
}
