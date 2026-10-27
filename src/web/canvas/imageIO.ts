import type { RgbaImage } from "../../domain/image";

/** Decodes an image file into RGBA pixels, in the browser only (no upload). */
export async function decodeFile(file: File): Promise<RgbaImage> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("Canvas 2D is not available.");
    context.drawImage(bitmap, 0, 0);
    const { width, height, data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return { width, height, data };
  } finally {
    bitmap.close();
  }
}
