import { describe, expect, it } from 'vitest';
import { stockSupplyClass } from './stockStrip';

describe('stock strip supply tone', () => {
  it('matches the shared near-cap (within 4) and full thresholds', () => {
    expect(stockSupplyClass(30, 36)).toContain('d7e6f2');
    expect(stockSupplyClass(32, 36)).toContain('f0c75e');
    expect(stockSupplyClass(36, 36)).toContain('e87aa8');
  });
});
