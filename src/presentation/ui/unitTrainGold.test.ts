import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  sharedUnitTrainGoldLabel,
  unitTrainGold,
  unitTrainGoldLabel,
} from './unitTrainGold';

describe('unitTrainGold', () => {
  it('labels catalog train gold for a known unit', () => {
    const n = unitTrainGold('scavenger');
    expect(n).toBe(getUnitType('scavenger').costGold);
    expect(unitTrainGoldLabel('scavenger')).toBe(
      t('sel.trainGoldTip', { n: n! }),
    );
    expect(sharedUnitTrainGoldLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.trainGoldTip', { n: n! }),
    );
    expect(sharedUnitTrainGoldLabel(['scavenger', 'tin_knight'])).toBeNull();
  });
});
