import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  sharedUnitSupplyCostLabel,
  UNIT_SUPPLY_COST,
  unitSupplyCost,
  unitSupplyCostLabel,
} from './unitSupplyCost';

describe('unitSupplyCost', () => {
  it('labels Supply · n (one slot per unit; same-type only)', () => {
    expect(unitSupplyCost('scavenger')).toBe(UNIT_SUPPLY_COST);
    expect(unitSupplyCostLabel('scavenger')).toBe(
      t('sel.supplyTip', { n: UNIT_SUPPLY_COST }),
    );
    expect(unitSupplyCostLabel('scavenger')).toMatch(/^Supply ·/);
    expect(unitSupplyCostLabel('scavenger')).toBe('Supply · 1');
    expect(sharedUnitSupplyCostLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.supplyTip', { n: UNIT_SUPPLY_COST }),
    );
    expect(sharedUnitSupplyCostLabel(['scavenger', 'tin_knight'])).toBeNull();
  });
});
