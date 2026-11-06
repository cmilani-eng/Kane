/**
 * Touch stand-in for a right-click order. Pure so the hold time and
 * drift limit can be unit-tested without Phaser.
 */

/** How long a finger must stay down before the hold becomes an order. */
export const TOUCH_LONG_PRESS_MS = 450;

/**
 * Screen-pixel drift that cancels the hold. Past this the gesture is a
 * drag (box select), not a move / attack / gather order.
 */
export const TOUCH_LONG_PRESS_SLOP_PX = 10;

export type TouchLongPressAction = 'wait' | 'order' | 'cancel';

export function touchLongPressAction(
  elapsedMs: number,
  movedPx: number,
  holdMs = TOUCH_LONG_PRESS_MS,
  slopPx = TOUCH_LONG_PRESS_SLOP_PX,
): TouchLongPressAction {
  if (movedPx > slopPx) return 'cancel';
  if (elapsedMs >= holdMs) return 'order';
  return 'wait';
}
