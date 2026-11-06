import { describe, expect, it } from 'vitest';
import {
  TOUCH_LONG_PRESS_MS,
  TOUCH_LONG_PRESS_SLOP_PX,
  touchLongPressAction,
} from './touchLongPress';

describe('touchLongPressAction', () => {
  it('waits until the hold reaches 450 ms, then orders', () => {
    expect(touchLongPressAction(TOUCH_LONG_PRESS_MS - 1, 0)).toBe('wait');
    expect(touchLongPressAction(TOUCH_LONG_PRESS_MS, 0)).toBe('order');
    expect(touchLongPressAction(TOUCH_LONG_PRESS_MS + 40, 0)).toBe('order');
  });

  it('cancels when the finger drifts past the tolerance, even after the hold', () => {
    expect(touchLongPressAction(TOUCH_LONG_PRESS_MS, TOUCH_LONG_PRESS_SLOP_PX)).toBe(
      'order',
    );
    expect(
      touchLongPressAction(TOUCH_LONG_PRESS_MS, TOUCH_LONG_PRESS_SLOP_PX + 0.1),
    ).toBe('cancel');
    expect(touchLongPressAction(0, TOUCH_LONG_PRESS_SLOP_PX + 1)).toBe('cancel');
  });
});
