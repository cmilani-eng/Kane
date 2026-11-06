import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  sharedUnitTrainCrystalLabel,
  unitTrainCrystal,
  unitTrainCrystalLabel,
} from './unitTrainCrystal';

describe('unitTrainCrystal', () => {
  it('labels catalog train crystals when the unit costs some', () => {
    const n = unitTrainCrystal('rock_thrower');
    expect(n).toBe(getUnitType('rock_thrower').costCrystals);
    expect(n).toBeGreaterThan(0);
    expect(unitTrainCrystalLabel('rock_thrower')).toBe(
      t('sel.trainCrystalTip', { n: n! }),
    );
    expect(sharedUnitTrainCrystalLabel(['rock_thrower', 'rock_thrower'])).toBe(
      t('sel.trainCrystalTip', { n: n! }),
    );
    expect(
      sharedUnitTrainCrystalLabel(['rock_thrower', 'scavenger']),
    ).toBeNull();
  });

  it('omits the tip when catalog crystal cost is zero', () => {
    expect(unitTrainCrystal('scavenger')).toBeNull();
    expect(unitTrainCrystalLabel('scavenger')).toBeNull();
  });
});
