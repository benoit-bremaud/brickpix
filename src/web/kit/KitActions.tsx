import { useState } from "react";

import { copyText, downloadText } from "./export";

type Props = { readonly xml: string; readonly fileName: string; readonly onBack: () => void };

/** Print, copy or download the BrickLink list, or go back to editing (explicit labels). */
export function KitActions({ xml, fileName, onBack }: Props) {
  const [copyFailed, setCopyFailed] = useState(false);
  const copy = async () => setCopyFailed(!(await copyText(xml)));
  return (
    <div className="kit-actions">
      <button type="button" onClick={() => window.print()}>Imprimer le plan</button>
      <button type="button" onClick={() => void copy()}>Copier la liste BrickLink</button>
      <button type="button" onClick={() => downloadText(xml, fileName, "application/xml")}>Télécharger la liste BrickLink</button>
      <button type="button" onClick={onBack}>Retour à l'édition</button>
      {copyFailed && <p role="alert" className="error">Copie impossible, utilisez Télécharger.</p>}
    </div>
  );
}
