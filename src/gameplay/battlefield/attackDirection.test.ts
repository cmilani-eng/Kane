import { describe, expect, it } from 'vitest';
import { attackDirectionArrow } from './attackDirection';

describe('attackDirectionArrow', () => {
  it('returns center mark inside the deadzone', () => {
    expect(attackDirectionArrow(100, 100, 110, 105, 96)).toBe('•');
  });

  it('points cardinal and diagonal toward the hit', () => {
    expect(attackDirectionArrow(0, 0, 200, 0)).toBe('→');
    expect(attackDirectionArrow(0, 0, -200, 0)).toBe('←');
    expect(attackDirectionArrow(0, 0, 0, 200)).toBe('↓');
    expect(attackDirectionArrow(0, 0, 0, -200)).toBe('↑');
    expect(attackDirectionArrow(0, 0, 200, 200)).toBe('↘');
    expect(attackDirectionArrow(0, 0, -200, -200)).toBe('↖');
  });
});
