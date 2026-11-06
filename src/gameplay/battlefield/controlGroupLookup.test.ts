import { describe, expect, it } from 'vitest';
import { createControlGroups } from './battlefieldOrders';
import { buildUnitGroupSlotIndex } from './controlGroupLookup';

describe('buildUnitGroupSlotIndex', () => {
  it('maps each unit to its lowest slot', () => {
    const g = createControlGroups();
    g.set(3, [10, 11]);
    g.set(1, [11, 12]);
    g.set(7, [10]);
    const idx = buildUnitGroupSlotIndex(g);
    expect(idx.get(10)).toBe(3); // slots 3 and 7 → lowest 3
    expect(idx.get(11)).toBe(1);
    expect(idx.get(12)).toBe(1);
    expect(idx.has(99)).toBe(false);
  });

  it('skips empty slots', () => {
    const g = createControlGroups();
    g.set(2, []);
    g.set(5, [42]);
    const idx = buildUnitGroupSlotIndex(g);
    expect(idx.get(42)).toBe(5);
    expect(idx.size).toBe(1);
  });
});
