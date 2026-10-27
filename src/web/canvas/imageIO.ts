import type { RgbaImage } from "../../domain/mosaic";

/** Longest decoded side: well above 8 plates × 16 studs, and bounded memory (spec quantise-mosaic.md). */
export const MAX_DECODE_SIDE = 2048;

/** Reads the natural size from the file header through a local blob URL, without decoding pixels. */
async function readSize(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Not a decodable image."));
      image.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Decodes a file straight to at most MAX_DECODE_SIDE on its longest side; the full size is never materialised. */
async function decodeBitmap(file: File): Promise<ImageBitmap> {
  const { width, height } = await readSize(file);
  const scale = MAX_DECODE_SIDE / Math.max(width, height);
  if (scale >= 1) return createImageBitmap(file);
  return createImageBitmap(file, {
    resizeWidth: Math.max(1, Math.round(width * scale)),
    resizeHeight: Math.max(1, Math.round(height * scale)),
    resizeQuality: "high",
  });
}

/**
 * Decodes an image file into RGBA pixels, in the browser only (no upload).
 * @throws when the file is not a decodable image or Canvas 2D is unavailable.
 */
export async function decodeFile(file: File): Promise<RgbaImage> {
  const bitmap = await decodeBitmap(file);
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
