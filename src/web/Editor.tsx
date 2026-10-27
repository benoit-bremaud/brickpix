import { useRef, useState, type DragEvent } from "react";

import { DEFAULT_SIZE, type Mosaic, type MosaicSize, type RgbaImage } from "../domain/mosaic";
import { decodeFile } from "./canvas/imageIO";
import { Kit } from "./kit/Kit";
import { Workspace } from "./retouch/Workspace";

/** The decoded photo, its import number (a new one remounts the workspace) and the last decode error. */
function useImport() {
  const [photo, setPhoto] = useState<{ readonly source: RgbaImage; readonly id: number }>();
  const [error, setError] = useState<string>();
  const latestImport = useRef(0);

  const importFile = async (file: File | undefined) => {
    if (file === undefined) return;
    const id = ++latestImport.current;
    try {
      const source = await decodeFile(file);
      if (id !== latestImport.current) return; // a newer import superseded this one
      setPhoto({ source, id });
      setError(undefined);
    } catch {
      if (id !== latestImport.current) return;
      setError("Impossible de lire cette image. Essayez un fichier JPEG, PNG ou WebP.");
    }
  };
  return { photo, error, importFile };
}

/**
 * The kit of the photo it was ordered for; a new photo returns to editing (05-state). The mosaic is
 * recomputed from the current inputs, never taken from the debounced preview (spec kit.md).
 * `preparing` is true from the click until the kit is set, so the editor freezes its inputs.
 */
function useKit(source: RgbaImage | undefined) {
  const [kit, setKit] = useState<{ readonly source: RgbaImage; readonly mosaic: Mosaic }>();
  const [preparing, setPreparing] = useState(false);
  const orderButton = useRef<HTMLButtonElement>(null);
  const order = (current: RgbaImage, compute: () => Mosaic) => {
    setPreparing(true);
    // Let the browser paint «Préparation du kit…» before the blocking computation (spec kit.md).
    requestAnimationFrame(() => setTimeout(() => {
      // finally: a failed computation must never leave the editor frozen.
      try {
        setKit({ source: current, mosaic: compute() });
      } finally {
        setPreparing(false);
      }
    }, 0));
  };
  const back = () => {
    setKit(undefined);
    // The button is hidden until the re-render; focus it once it is shown again (WCAG 2.4.3).
    setTimeout(() => orderButton.current?.focus(), 0);
  };
  const shown = kit !== undefined && kit.source === source ? kit.mosaic : undefined;
  return { kit: shown, preparing, order, back, orderButton };
}

/** Import, the retouch workspace with its live preview («Aperçu») and the «Commander mon kit» screen. */
export function Editor() {
  const { photo, error, importFile } = useImport();
  const [size, setSize] = useState<MosaicSize>(DEFAULT_SIZE);
  const [dithering, setDithering] = useState(false);
  const { kit, preparing, order, back, orderButton } = useKit(photo?.source);
  const [over, setOver] = useState(false);
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    void importFile(event.dataTransfer.files[0]);
  };

  return (
    <>
      <label className="dropzone" inert={preparing} data-over={over} onDragOver={(event) => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
        <span>Choisissez une photo ou déposez-la ici</span>
        <input type="file" accept="image/*" className="visually-hidden" onChange={(event) => void importFile(event.target.files?.[0])} />
      </label>
      {error !== undefined && <p role="alert" className="error">{error}</p>}
      {photo !== undefined && (
        <Workspace key={photo.id} source={photo.source} size={size} onSize={setSize} dithering={dithering} onDithering={setDithering}
          hidden={kit !== undefined} preparing={preparing} onOrder={(compute) => order(photo.source, compute)} orderButton={orderButton} />
      )}
      {kit !== undefined && <Kit mosaic={kit} onBack={back} />}
    </>
  );
}
