import { describe, expect, it } from 'vitest';
import { matchTitleLeftPx } from './matchTitleLeft';

describe('matchTitleLeftPx', () => {
  it('keeps the pad when the back link is absent or off-screen', () => {
    expect(matchTitleLeftPx(0, 0, 1, 12)).toBe(12);
    expect(matchTitleLeftPx(-40, 0, 1, 12)).toBe(12);
  });

  it('starts the title one pad past the pill at 1:1 scale', () => {
    expect(matchTitleLeftPx(96, 0, 1, 12)).toBe(108);
  });

  it('converts the pill edge through the canvas offset', () => {
    expect(matchTitleLeftPx(196, 100, 1, 12)).toBe(108);
  });

  it('converts the pill edge through a display scale below 1', () => {
    expect(matchTitleLeftPx(96, 0, 0.5, 12)).toBe(204);
  });

  it('rounds up to whole canvas pixels', () => {
    expect(matchTitleLeftPx(96.4, 0, 1, 12)).toBe(109);
  });

  it('falls back to the pad for a degenerate display scale', () => {
    expect(matchTitleLeftPx(96, 0, 0, 12)).toBe(12);
  });
});
