import { describe, expect, it } from 'vitest';

/** Mirrors the selection-panel low-HP threshold. */
function isLowHp(hp: number, maxHp: number): boolean {
  if (maxHp <= 0) return false;
  return hp / maxHp < 0.35;
}

describe('selection low-HP pulse threshold', () => {
  it('flags critical HP under 35%', () => {
    expect(isLowHp(34, 100)).toBe(true);
    expect(isLowHp(35, 100)).toBe(false);
    expect(isLowHp(100, 100)).toBe(false);
  });
});
