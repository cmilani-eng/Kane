import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import { sharedUnitNameTipLabel, unitNameTipLabel } from './unitNameTip';

describe('unitNameTip', () => {
  it('labels the catalog unit name for a selection', () => {
    expect(unitNameTipLabel('bonker')).toBe(
      t('sel.nameTip', { name: getUnitType('bonker').name }),
    );
    expect(unitNameTipLabel('scavenger')).toContain(
      getUnitType('scavenger').name,
    );
  });

  it('shares a tip only when every selected unit is the same type', () => {
    expect(sharedUnitNameTipLabel(['bonker', 'bonker'])).toBe(
      t('sel.nameTip', { name: getUnitType('bonker').name }),
    );
    expect(sharedUnitNameTipLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitNameTipLabel([])).toBeNull();
  });
});
