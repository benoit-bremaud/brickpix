import { cropFor, MAX_ZOOM, stretchPlates, type Framing } from "../../domain/crop";
import type { MosaicSize, Rect } from "../../domain/mosaic";

/** A point in oriented-image pixels. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** A frame handle: -1 left/top, 1 right/bottom, 0 when the handle does not move that axis. */
export interface Handle {
  readonly x: -1 | 0 | 1;
  readonly y: -1 | 0 | 1;
}

/** Arrow keys pan by this share of the frame (spec retouch.md). */
export const KEY_PAN_SHARE = 0.05;
/** One + / − key press or wheel notch multiplies the zoom by this factor. */
export const ZOOM_STEP = 1.25;

const SIDES = [-1, 0, 1] as const;

/** The corner or side-middle handle of `crop` within `reach` of `point`, if any. */
export function handleAt(crop: Rect, point: Point, reach: number): Handle | undefined {
  for (const x of SIDES) {
    for (const y of SIDES) {
      if (x === 0 && y === 0) continue;
      const hx = crop.x + ((x + 1) / 2) * crop.width;
      const hy = crop.y + ((y + 1) / 2) * crop.height;
      if (Math.abs(point.x - hx) <= reach && Math.abs(point.y - hy) <= reach) return { x, y };
    }
  }
  return undefined;
}

/** Moves the frame by (dx, dy) image pixels; the centre is snapped to where the crop really is. */
export function pan(framing: Framing, image: { width: number; height: number }, size: MosaicSize, delta: Point): Framing {
  const { width, height } = image;
  const moved = { ...framing, centreX: framing.centreX + delta.x / width, centreY: framing.centreY + delta.y / height };
  const crop = cropFor(width, height, size, moved);
  return { ...framing, centreX: (crop.x + crop.width / 2) / width, centreY: (crop.y + crop.height / 2) / height };
}

/** Multiplies the zoom by `factor`, within 1..MAX_ZOOM. */
export function zoomBy(framing: Framing, factor: number): Framing {
  return { ...framing, zoom: Math.min(MAX_ZOOM, Math.max(1, framing.zoom * factor)) };
}

/** The size after dragging `handle` of `crop` by (dx, dy) image pixels. */
export function stretch(size: MosaicSize, handle: Handle, crop: Rect, delta: Point): MosaicSize {
  return {
    platesWide: handle.x === 0 ? size.platesWide : stretchPlates(size.platesWide, crop.width + handle.x * delta.x, crop.width),
    platesHigh: handle.y === 0 ? size.platesHigh : stretchPlates(size.platesHigh, crop.height + handle.y * delta.y, crop.height),
  };
}
