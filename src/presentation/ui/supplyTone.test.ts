import { describe, expect, it } from 'vitest';
import {
  SUPPLY_NEAR_CAP,
  formatSupplyLine,
  supplySlotsLeft,
  supplyTone,
} from './supplyTone';

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

describe('formatSupplyLine', () => {
  it('keeps the plain line when supply has room', () => {
    expect(formatSupplyLine(20, 36)).toBe('Supply  20 / 36');
  });

  it('appends remaining slots when near cap', () => {
    expect(supplySlotsLeft(32, 36)).toBe(4);
    expect(formatSupplyLine(32, 36)).toContain('4');
    expect(formatSupplyLine(32, 36)).toMatch(/32/);
  });

  it('marks full when at cap', () => {
    expect(supplySlotsLeft(36, 36)).toBe(0);
    expect(formatSupplyLine(36, 36)).toMatch(/36/);
  });
});
