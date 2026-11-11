/**
 * Pure layout numbers for the game picker, derived from the canvas width.
 * GamePickerScene calls this every time it builds, so the cards always follow the real
 * canvas size (it can be 0 at first and changes on resize and rotation).
 */

export interface PickerMetrics {
  /** Side gutter in px. */
  margin: number;
  /** Width of the card column area in px (the old picker capped it at 920). */
  contentW: number;
  /** Gap between cards in px. */
  gap: number;
  /** 2 when two cards fit side by side, else 1. */
  columns: 1 | 2;
  cardW: number;
  /** Size of the gradient "Games" title in px. */
  titleSize: number;
}

const MAX_CONTENT_W = 920;
const MIN_CARD_W = 280;
const GAP = 28;
const MAX_SINGLE_CARD_W = 520;

function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Returns null while the canvas has no size yet, so the scene waits for a resize. */
export function pickerMetrics(width: number): PickerMetrics | null {
  if (!Number.isFinite(width) || width < 1) return null;
  const margin = clamp(20, Math.round(width * 0.04), 36);
  const contentW = Math.max(1, Math.min(MAX_CONTENT_W, width - margin * 2));
  const columns = contentW >= MIN_CARD_W * 2 + GAP ? 2 : 1;
  const raw = Math.floor((contentW - GAP * (columns - 1)) / columns);
  const cardW = columns === 1 ? Math.min(MAX_SINGLE_CARD_W, raw) : raw;
  return {
    margin,
    contentW,
    gap: GAP,
    columns,
    cardW,
    titleSize: Math.round(clamp(40, width * 0.09, 64)),
  };
}

/** Resting tilt in degrees: odd cards lean left, even cards lean right, as on the old picker. */
export function cardTiltDeg(index: number): number {
  return index % 2 === 0 ? -1.6 : 1.4;
}

/** Furthest the page can scroll when the content is taller than the canvas. */
export function maxScroll(contentHeight: number, viewHeight: number): number {
  return Math.max(0, Math.ceil(contentHeight - viewHeight));
}

export function clampScroll(value: number, max: number): number {
  return clamp(0, value, max);
}

/** Next focused card for Tab / arrow keys. `current` is -1 before any card has focus. */
export function nextFocus(current: number, count: number, step: 1 | -1): number {
  if (count < 1) return -1;
  if (current < 0) return step === 1 ? 0 : count - 1;
  return (current + step + count) % count;
}
