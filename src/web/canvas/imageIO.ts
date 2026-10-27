import type { RgbaImage } from "../../domain/mosaic";

/** Longest decoded side: well above 8 plates × 16 studs, and bounded memory (spec quantise-mosaic.md). */
export const MAX_DECODE_SIDE = 2048;

/** Decodes a file, downscaled so its longest side is at most MAX_DECODE_SIDE. */
async function decodeBitmap(file: File): Promise<ImageBitmap> {
  const full = await createImageBitmap(file);
  const scale = MAX_DECODE_SIDE / Math.max(full.width, full.height);
  if (scale >= 1) return full;
  try {
    return await createImageBitmap(full, {
      resizeWidth: Math.max(1, Math.round(full.width * scale)),
      resizeHeight: Math.max(1, Math.round(full.height * scale)),
      resizeQuality: "high",
    });
  } finally {
    full.close();
  }
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
