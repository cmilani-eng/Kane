import { describe, expect, it } from 'vitest';
import { SUPPLY_NEAR_CAP, supplyTone } from './supplyTone';

describe('supplyTone', () => {
  it('stays ok until within NEAR of cap', () => {
    expect(supplyTone(0, 36)).toBe('ok');
    expect(supplyTone(31, 36)).toBe('ok');
    expect(supplyTone(36 - SUPPLY_NEAR_CAP - 1, 36)).toBe('ok');
  });

  it('warns amber within 4 of cap', () => {
    expect(supplyTone(32, 36)).toBe('near');
    expect(supplyTone(35, 36)).toBe('near');
  });

  it('marks full at or above cap', () => {
    expect(supplyTone(36, 36)).toBe('full');
    expect(supplyTone(40, 36)).toBe('full');
  });
});
