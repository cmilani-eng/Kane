import { describe, expect, it } from 'vitest';
import {
  cardSizes,
  cardTiltDeg,
  clampScroll,
  coverHeight,
  maxScroll,
  nextFocus,
  pickerMetrics,
} from './pickerLayout';

describe('cardSizes', () => {
  it('uses less padding and smaller text on narrow cards', () => {
    expect(cardSizes(236)).toEqual({ pad: 18, titleSize: 24, blurbSize: 14 });
    expect(cardSizes(360)).toEqual({ pad: 24, titleSize: 30, blurbSize: 15 });
  });
});

describe('coverHeight', () => {
  it('keeps a card picture at 5:3', () => {
    expect(coverHeight(500)).toBe(300);
    expect(coverHeight(394)).toBe(236);
  });

  it('stays in proportion as cards narrow on a phone', () => {
    for (const width of [240, 283, 320, 394, 468]) {
      expect(coverHeight(width) / width).toBeCloseTo(0.6, 1);
    }
  });
});

describe('pickerMetrics', () => {
  it('waits while the canvas has no size', () => {
    expect(pickerMetrics(0)).toBeNull();
    expect(pickerMetrics(-5)).toBeNull();
    expect(pickerMetrics(Number.NaN)).toBeNull();
  });

  it('shows six games in one row on a 15-16 inch laptop, so nothing needs scrolling', () => {
    for (const width of [1366, 1440, 1536, 1728, 1920]) {
      const m = pickerMetrics(width, 6)!;
      expect(m.columns).toBe(6);
      expect(m.cardW).toBeGreaterThanOrEqual(200);
    }
    const wide = pickerMetrics(1728, 6)!;
    expect(wide.contentW).toBe(1500);
    expect(wide.cardW).toBe(236);
    expect(wide.titleSize).toBe(64);
  });

  it('keeps cards a comfortable size when there are only a few games', () => {
    const four = pickerMetrics(1728, 4)!;
    expect(four.columns).toBe(4);
    expect(four.cardW).toBe(360);
    expect(pickerMetrics(1728, 3)!.columns).toBe(3);
    expect(pickerMetrics(1728, 1)!.columns).toBe(1);
  });

  it('uses fewer, wider columns on smaller screens', () => {
    expect(pickerMetrics(1024, 6)!.columns).toBe(4);
    expect(pickerMetrics(768, 6)!.columns).toBe(3);
    expect(pickerMetrics(768, 6)!.cardW).toBe(224);
  });

  it('stacks the cards in one column on a phone, capped so a card does not stretch', () => {
    const phone = pickerMetrics(375, 6)!;
    expect(phone.columns).toBe(1);
    expect(phone.cardW).toBe(335);
    const wider = pickerMetrics(450, 6)!;
    expect(wider.columns).toBe(1);
    expect(wider.cardW).toBe(360);
  });

  it('never makes a multi-column card narrower than 200px, and the row always fits', () => {
    for (let width = 320; width <= 2400; width += 40) {
      for (let count = 1; count <= 8; count++) {
        const m = pickerMetrics(width, count)!;
        if (m.columns > 1) expect(m.cardW).toBeGreaterThanOrEqual(200);
        expect(m.columns * m.cardW + (m.columns - 1) * m.gap).toBeLessThanOrEqual(m.contentW);
        expect(m.columns).toBeLessThanOrEqual(Math.max(1, count));
      }
    }
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
