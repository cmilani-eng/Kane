import { describe, expect, it } from 'vitest';
import { cardTiltDeg, clampScroll, maxScroll, nextFocus, pickerMetrics } from './pickerLayout';

describe('pickerMetrics', () => {
  it('waits while the canvas has no size', () => {
    expect(pickerMetrics(0)).toBeNull();
    expect(pickerMetrics(-5)).toBeNull();
    expect(pickerMetrics(Number.NaN)).toBeNull();
  });

  it('puts two cards side by side on a desktop and caps the column at 920', () => {
    const m = pickerMetrics(1280)!;
    expect(m.columns).toBe(2);
    expect(m.contentW).toBe(920);
    expect(m.cardW).toBe(446);
    expect(m.titleSize).toBe(64);
  });

  it('keeps two columns on a portrait tablet', () => {
    const m = pickerMetrics(768)!;
    expect(m.columns).toBe(2);
    expect(m.cardW).toBeGreaterThanOrEqual(280);
    expect(m.cardW * 2 + m.gap).toBeLessThanOrEqual(m.contentW);
  });

  it('stacks the cards in one column when two would be under 280px each', () => {
    const m = pickerMetrics(500)!;
    expect(m.columns).toBe(1);
    expect(m.cardW).toBe(460);
  });

  it('caps a single card so it does not stretch across a wide column', () => {
    const m = pickerMetrics(600)!;
    expect(m.columns).toBe(1);
    expect(m.cardW).toBeLessThanOrEqual(520);
  });

  it('scales the title between 40 and 64', () => {
    expect(pickerMetrics(360)!.titleSize).toBe(40);
    expect(pickerMetrics(600)!.titleSize).toBe(54);
    expect(pickerMetrics(2000)!.titleSize).toBe(64);
  });
});

describe('cardTiltDeg', () => {
  it('leans odd cards left and even cards right', () => {
    expect(cardTiltDeg(0)).toBe(-1.6);
    expect(cardTiltDeg(1)).toBe(1.4);
    expect(cardTiltDeg(2)).toBe(-1.6);
  });
});

describe('scrolling', () => {
  it('only scrolls when the content is taller than the canvas', () => {
    expect(maxScroll(500, 800)).toBe(0);
    expect(maxScroll(950, 800)).toBe(150);
    expect(maxScroll(800.2, 800)).toBe(1);
  });

  it('clamps the scroll position to the range', () => {
    expect(clampScroll(-10, 150)).toBe(0);
    expect(clampScroll(60, 150)).toBe(60);
    expect(clampScroll(999, 150)).toBe(150);
    expect(clampScroll(30, 0)).toBe(0);
  });
});

describe('nextFocus', () => {
  it('starts on the first card with Tab and on the last with Shift+Tab', () => {
    expect(nextFocus(-1, 2, 1)).toBe(0);
    expect(nextFocus(-1, 2, -1)).toBe(1);
  });

  it('wraps around in both directions', () => {
    expect(nextFocus(1, 2, 1)).toBe(0);
    expect(nextFocus(0, 2, -1)).toBe(1);
    expect(nextFocus(0, 3, 1)).toBe(1);
  });

  it('has no focus when there are no cards', () => {
    expect(nextFocus(-1, 0, 1)).toBe(-1);
  });
});
