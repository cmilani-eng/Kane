import { describe, expect, it } from 'vitest';
import type { BattlefieldUnit } from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';
import { unitCurrentCargoLabel } from './unitCurrentCargo';

function stub(
  carrying: number,
  carryCapacity = 10,
  canGather = true,
  hp = 10,
): BattlefieldUnit {
  return { hp, carrying, carryCapacity, canGather } as BattlefieldUnit;
}

describe('unitCurrentCargo', () => {
  it('returns null for non-workers', () => {
    expect(unitCurrentCargoLabel([stub(0, 0, false)])).toBeNull();
    expect(unitCurrentCargoLabel([])).toBeNull();
  });

  it('labels empty and loaded haul as Cargo · empty / Cargo · n/cap', () => {
    expect(unitCurrentCargoLabel([stub(0)])).toBe(t('sel.cargoNowEmpty'));
    expect(unitCurrentCargoLabel([stub(8, 10)])).toBe(
      t('sel.cargoNowTip', { n: 8, cap: 10 }),
    );
  });

  it('sums group cargo and capacity', () => {
    expect(unitCurrentCargoLabel([stub(4, 10), stub(6, 10)])).toBe(
      t('sel.cargoNowTip', { n: 10, cap: 20 }),
    );
  });
});
