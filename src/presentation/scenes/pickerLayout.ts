/**
 * Pure layout numbers for the game picker, derived from the canvas width.
 * GamePickerScene calls this every time it builds, so the cards always follow the real
 * canvas size (it can be 0 at first and changes on resize and rotation).
 */

export interface PickerMetrics {
  /** Side gutter in px. */
  margin: number;
  /** Width of the card area in px. */
  contentW: number;
  /** Gap between cards in px. */
  gap: number;
  /** How many cards fit side by side (1 to 4). */
  columns: number;
  cardW: number;
  /** Size of the gradient "Games" title in px. */
  titleSize: number;
}

const MAX_CONTENT_W = 1500;
const MIN_CARD_W = 200;
const GAP = 16;
/** Up to six cards in one row, so a 15-16 inch laptop shows six games without scrolling. */
const MAX_COLUMNS = 6;
const MAX_CARD_W = 360;

function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Returns null while the canvas has no size yet, so the scene waits for a resize.
 * `count` is how many games there are: with only a few, the cards stay a comfortable size
 * instead of spreading thin across the row.
 */
export function pickerMetrics(width: number, count = MAX_COLUMNS): PickerMetrics | null {
  if (!Number.isFinite(width) || width < 1) return null;
  const margin = clamp(20, Math.round(width * 0.04), 36);
  const contentW = Math.max(1, Math.min(MAX_CONTENT_W, width - margin * 2));
  const fitting = clamp(1, Math.floor((contentW + GAP) / (MIN_CARD_W + GAP)), MAX_COLUMNS);
  const columns = Math.min(fitting, Math.max(1, count));
  const raw = Math.floor((contentW - GAP * (columns - 1)) / columns);
  const cardW = Math.min(MAX_CARD_W, raw);
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

/** Card pictures are 5:3, like the old DOM cards' `aspect-[5/3]` image. */
export const COVER_ASPECT = 5 / 3;

/** Height of a card's picture for the width it is drawn at. */
export function coverHeight(width: number): number {
  return Math.round(width / COVER_ASPECT);
}

/** Padding and text sizes inside a card: narrower cards (several per row) use smaller ones. */
export function cardSizes(cardW: number): { pad: number; titleSize: number; blurbSize: number } {
  const narrow = cardW < 320;
  return { pad: narrow ? 18 : 24, titleSize: narrow ? 24 : 30, blurbSize: narrow ? 14 : 15 };
}
