import { describe, expect, it } from 'vitest';
import { carryLineFor } from './selectionPanel';
import type { BattlefieldUnit } from '../../gameplay/battlefield/battlefieldWorld';

function stubWorker(
  carrying: number,
  resource: 'gold' | 'magic_crystals' | null,
): BattlefieldUnit {
  return {
    hp: 10,
    carrying,
    carryingResource: resource,
  } as BattlefieldUnit;
}

describe('selection panel worker carry', () => {
  it('hides when empty-handed', () => {
    expect(carryLineFor([stubWorker(0, null)]).line).toBeNull();
  });

  it('shows labeled gold cargo for a single worker', () => {
    const { line, crystal } = carryLineFor([stubWorker(25, 'gold')]);
    expect(line).toContain('25');
    expect(line).toMatch(/Gold/i);
    expect(crystal).toBe(false);
  });

  it('sums group cargo of the same resource', () => {
    const { line, crystal } = carryLineFor([
      stubWorker(10, 'magic_crystals'),
      stubWorker(5, 'magic_crystals'),
    ]);
    expect(line).toContain('15');
    expect(crystal).toBe(true);
  });
});
