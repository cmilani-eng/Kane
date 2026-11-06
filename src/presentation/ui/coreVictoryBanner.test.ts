import { describe, expect, it } from 'vitest';
import { coreHoldRemainSec } from './coreVictoryBanner';

describe('coreHoldRemainSec', () => {
  it('ceils remaining ms to whole seconds', () => {
    expect(coreHoldRemainSec(60_000)).toBe(60);
    expect(coreHoldRemainSec(10_001)).toBe(11);
    expect(coreHoldRemainSec(999)).toBe(1);
    expect(coreHoldRemainSec(0)).toBe(0);
    expect(coreHoldRemainSec(-50)).toBe(0);
  });
});
