import { describe, expect, it } from 'vitest';
import { stockSupplyClass } from './stockStrip';

describe('stock strip supply tone', () => {
  it('matches the shared near-cap (within 4) and full thresholds', () => {
    expect(stockSupplyClass(30, 36)).toBe('text-kane-ink');
    expect(stockSupplyClass(32, 36)).toBe('text-kane-gold');
    expect(stockSupplyClass(36, 36)).toBe('text-kane-pink');
  });
});
