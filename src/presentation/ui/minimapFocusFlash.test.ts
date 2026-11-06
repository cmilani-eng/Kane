import { describe, expect, it } from 'vitest';
import {
  MINIMAP_FOCUS_FLASH_MS,
  minimapFocusFlashAlpha,
} from './minimap';

describe('minimap double-tap focus flash', () => {
  it('fades from 1 to 0 over the flash window', () => {
    expect(minimapFocusFlashAlpha(MINIMAP_FOCUS_FLASH_MS)).toBe(1);
    expect(minimapFocusFlashAlpha(MINIMAP_FOCUS_FLASH_MS / 2)).toBeCloseTo(
      0.5,
      5,
    );
    expect(minimapFocusFlashAlpha(0)).toBe(0);
  });
});
