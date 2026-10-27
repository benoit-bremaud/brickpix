import type { MosaicSize, Rect } from './mosaic';

/**
 * Largest rectangle of ratio platesWide:platesHigh centred in a width × height image (cover fit),
 * with integer bounds of at least 1 × 1. The retouch brick replaces it by the user's crop.
 */
export function defaultCrop(width: number, height: number, size: MosaicSize): Rect {
  const ratio = size.platesWide / size.platesHigh;
  const cropWidth = Math.max(1, Math.min(width, Math.round(height * ratio)));
  const cropHeight = Math.max(1, Math.min(height, Math.round(cropWidth / ratio)));
  return {
    x: Math.floor((width - cropWidth) / 2),
    y: Math.floor((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}
