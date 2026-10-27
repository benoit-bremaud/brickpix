import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

import type { Framing } from "../../domain/crop";
import type { MosaicSize, Rect, RgbaImage } from "../../domain/mosaic";
import { handleAt, KEY_PAN_SHARE, pan, stretch, zoomBy, ZOOM_STEP, type Handle, type Point } from "./frameGeometry";

/** Long press that shows the photo before retouch (spec retouch.md). */
export const LONG_PRESS_MS = 500;
/** Distance in CSS pixels within which a press grabs a frame handle. */
const HANDLE_REACH_PX = 24;

/** What the gestures read (latest render) and change. */
export interface FrameTarget {
  readonly framing: boolean; // «Cadrer» is open: the canvas shows the whole photo
  readonly image: RgbaImage;
  readonly crop: Rect;
  readonly size: MosaicSize;
  readonly settings: Framing;
  readonly onFraming: (framing: Framing) => void;
  readonly onSize: (size: MosaicSize) => void;
  readonly onBefore: (before: boolean) => void;
}

/** One drag: what it started from, so every move applies to the start state (no drift). */
interface Drag {
  readonly start: Point;
  readonly framing: Framing;
  readonly crop: Rect;
  readonly size: MosaicSize;
  readonly handle: Handle | undefined;
}

/** Mutable gesture state, alive for the canvas lifetime. */
interface Session {
  target: FrameTarget | undefined;
  readonly pointers: Map<number, Point>;
  drag: Drag | undefined;
  pinch: { readonly distance: number; readonly framing: Framing } | undefined;
  press: ReturnType<typeof setTimeout> | undefined;
}

type CanvasPointer = PointerEvent<HTMLCanvasElement>;

/** Pointer position in oriented-image pixels (the canvas shows the whole photo while framing). */
function toImage(canvas: HTMLCanvasElement, image: RgbaImage, event: { clientX: number; clientY: number }): Point {
  const box = canvas.getBoundingClientRect();
  const scale = box.width > 0 ? image.width / box.width : 1;
  return { x: (event.clientX - box.left) * scale, y: (event.clientY - box.top) * scale };
}

function spread(points: Iterable<Point>): number {
  const [a, b] = [...points];
  return a === undefined || b === undefined ? 0 : Math.hypot(a.x - b.x, a.y - b.y);
}

function endPress(session: Session): void {
  clearTimeout(session.press);
  session.press = undefined;
}

function pointerDown(session: Session, event: CanvasPointer): void {
  const target = session.target;
  if (target === undefined) return;
  if (!target.framing) {
    endPress(session);
    session.press = setTimeout(() => target.onBefore(true), LONG_PRESS_MS);
    return;
  }
  event.currentTarget.setPointerCapture?.(event.pointerId);
  const point = toImage(event.currentTarget, target.image, event);
  session.pointers.set(event.pointerId, point);
  if (session.pointers.size === 2) {
    session.drag = undefined;
    session.pinch = { distance: spread(session.pointers.values()), framing: target.settings };
    return;
  }
  const reach = HANDLE_REACH_PX * (target.image.width / Math.max(1, event.currentTarget.getBoundingClientRect().width));
  const { crop, settings, size } = target;
  session.drag = { start: point, framing: settings, crop, size, handle: handleAt(crop, point, reach) };
}

function pointerMove(session: Session, event: CanvasPointer): void {
  const target = session.target;
  if (target?.framing !== true || !session.pointers.has(event.pointerId)) return;
  const point = toImage(event.currentTarget, target.image, event);
  session.pointers.set(event.pointerId, point);
  const { pinch, drag } = session;
  if (pinch !== undefined) {
    if (pinch.distance > 0) target.onFraming(zoomBy(pinch.framing, spread(session.pointers.values()) / pinch.distance));
    return;
  }
  if (drag === undefined) return;
  const delta = { x: point.x - drag.start.x, y: point.y - drag.start.y };
  if (drag.handle === undefined) target.onFraming(pan(drag.framing, target.image, drag.size, { x: -delta.x, y: -delta.y }));
  else target.onSize(stretch(drag.size, drag.handle, drag.crop, delta));
}

function pointerUp(session: Session, event: CanvasPointer): void {
  // Always release «before»: «Cadrer» may have opened during the press.
  endPress(session);
  session.target?.onBefore(false);
  session.pointers.delete(event.pointerId);
  session.pinch = undefined;
  session.drag = undefined;
  const [rest] = session.pointers.entries();
  const target = session.target;
  // The finger left after a pinch keeps panning from where it is.
  if (rest !== undefined && target !== undefined) {
    const { crop, settings, size } = target;
    session.drag = { start: rest[1], framing: settings, crop, size, handle: undefined };
  }
}

/** Arrow keys pan by KEY_PAN_SHARE of the frame, + and − zoom. Returns false for any other key. */
function frameKey(target: FrameTarget, key: string): boolean {
  const step = { x: KEY_PAN_SHARE * target.crop.width, y: KEY_PAN_SHARE * target.crop.height };
  const moves: Partial<Record<string, Point>> = {
    ArrowLeft: { x: -step.x, y: 0 },
    ArrowRight: { x: step.x, y: 0 },
    ArrowUp: { x: 0, y: -step.y },
    ArrowDown: { x: 0, y: step.y },
  };
  const zooms: Partial<Record<string, number>> = { "+": ZOOM_STEP, "=": ZOOM_STEP, "-": 1 / ZOOM_STEP };
  const move = moves[key];
  const zoom = zooms[key];
  if (move !== undefined) target.onFraming(pan(target.settings, target.image, target.size, move));
  else if (zoom !== undefined) target.onFraming(zoomBy(target.settings, zoom));
  return move !== undefined || zoom !== undefined;
}

function keyDown(session: Session, event: KeyboardEvent<HTMLCanvasElement>): void {
  const target = session.target;
  if (target === undefined) return;
  if (target.framing ? frameKey(target, event.key) : event.key === " ") event.preventDefault();
  if (!target.framing && event.key === " " && !event.repeat) target.onBefore(true);
}

function keyUp(session: Session, event: KeyboardEvent<HTMLCanvasElement>): void {
  if (event.key === " ") session.target?.onBefore(false);
}

function wheel(session: Session, event: WheelEvent): void {
  const target = session.target;
  if (target?.framing !== true) return;
  event.preventDefault();
  target.onFraming(zoomBy(target.settings, event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP));
}

/**
 * Gestures on the preview canvas (spec retouch.md): while framing, drag to pan, handles to stretch
 * the size, pinch, wheel or + / − to zoom, arrows to pan; otherwise long press or Space shows «before».
 * The wheel listener is not passive, so the page does not scroll while it zooms the frame.
 */
export function useFrameGestures(canvas: RefObject<HTMLCanvasElement | null>, target: FrameTarget) {
  const session = useRef<Session>({ target: undefined, pointers: new Map(), drag: undefined, pinch: undefined, press: undefined });
  useEffect(() => {
    session.current.target = target;
  });
  useEffect(() => {
    const element = canvas.current;
    const onWheel = (event: WheelEvent) => wheel(session.current, event);
    const current = session.current;
    element?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element?.removeEventListener("wheel", onWheel);
      endPress(current); // a long press must not fire after unmount
    };
  }, [canvas]);
  // Each handler reads the session when the event fires, never during render.
  const up = (event: CanvasPointer) => pointerUp(session.current, event);
  return {
    onPointerDown: (event: CanvasPointer) => pointerDown(session.current, event),
    onPointerMove: (event: CanvasPointer) => pointerMove(session.current, event),
    onPointerUp: up,
    onPointerCancel: up,
    onPointerLeave: up,
    onKeyDown: (event: KeyboardEvent<HTMLCanvasElement>) => keyDown(session.current, event),
    onKeyUp: (event: KeyboardEvent<HTMLCanvasElement>) => keyUp(session.current, event),
  };
}
