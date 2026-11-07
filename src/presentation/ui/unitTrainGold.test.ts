import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  sharedUnitTrainGoldLabel,
  unitTrainGold,
  unitTrainGoldLabel,
} from './unitTrainGold';

describe('unitTrainGold', () => {
  it('labels Gold · n from catalog train gold', () => {
    const n = unitTrainGold('scavenger');
    expect(n).toBe(getUnitType('scavenger').costGold);
    expect(unitTrainGoldLabel('scavenger')).toBe(
      t('sel.trainGoldTip', { n: n! }),
    );
    expect(unitTrainGoldLabel('scavenger')).toMatch(/^Gold ·/);
    expect(unitTrainGoldLabel('scavenger')).not.toBe(
      t('sel.goldCost', { n: n! }),
    );
    expect(sharedUnitTrainGoldLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.trainGoldTip', { n: n! }),
    );
    expect(sharedUnitTrainGoldLabel(['scavenger', 'tin_knight'])).toBeNull();
  });
});
