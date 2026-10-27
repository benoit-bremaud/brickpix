import { Editor } from "./Editor";
import "./tokens.css";

/** Application shell: the photo-to-mosaic editor. */
export function App() {
  return (
    <main>
      <h1>brickpix</h1>
      <p>Transformez une photo en mosaïque LEGO. Votre photo reste dans votre navigateur.</p>
      <Editor />
    </main>
  );
}
