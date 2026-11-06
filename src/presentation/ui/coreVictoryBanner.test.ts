import { describe, expect, it } from 'vitest';
import { coreHoldProgress, coreHoldRemainSec } from './coreVictoryBanner';

describe('coreHoldRemainSec', () => {
  it('ceils remaining ms to whole seconds', () => {
    expect(coreHoldRemainSec(60_000)).toBe(60);
    expect(coreHoldRemainSec(10_001)).toBe(11);
    expect(coreHoldRemainSec(999)).toBe(1);
    expect(coreHoldRemainSec(0)).toBe(0);
    expect(coreHoldRemainSec(-50)).toBe(0);
  });
});

describe('coreHoldProgress', () => {
  it('maps remaining ms to 0→1 hold progress', () => {
    expect(coreHoldProgress(60_000, 60_000)).toBe(0);
    expect(coreHoldProgress(30_000, 60_000)).toBeCloseTo(0.5);
    expect(coreHoldProgress(0, 60_000)).toBe(1);
    expect(coreHoldProgress(-10, 60_000)).toBe(1);
  });
});
