import { describe, expect, it } from 'vitest';
import { carryLineFor } from './selectionPanel';
import type { BattlefieldUnit } from '../../gameplay/battlefield/battlefieldWorld';

function stubWorker(
  carrying: number,
  resource: 'gold' | 'magic_crystals' | null,
  carryCapacity = 10,
): BattlefieldUnit {
  return {
    hp: 10,
    carrying,
    carryingResource: resource,
    carryCapacity,
  } as BattlefieldUnit;
}

describe('selection panel worker carry', () => {
  it('hides when empty-handed', () => {
    expect(carryLineFor([stubWorker(0, null)]).line).toBeNull();
  });

  it('shows n/capacity with labeled gold for a single worker', () => {
    const { line, crystal } = carryLineFor([stubWorker(8, 'gold', 10)]);
    expect(line).toContain('8/10');
    expect(line).toMatch(/Gold/i);
    expect(crystal).toBe(false);
  });

  it('sums group cargo and capacity of the same resource', () => {
    const { line, crystal } = carryLineFor([
      stubWorker(10, 'magic_crystals', 12),
      stubWorker(5, 'magic_crystals', 12),
    ]);
    expect(line).toContain('15/24');
    expect(crystal).toBe(true);
  });

  it('hints deposit when full', () => {
    const { line, full } = carryLineFor([stubWorker(10, 'gold', 10)]);
    expect(full).toBe(true);
    expect(line).toMatch(/Full/i);
    expect(line).toMatch(/deposit/i);
  });
});
