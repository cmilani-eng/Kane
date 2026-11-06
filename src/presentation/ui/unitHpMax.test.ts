import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  sharedUnitHpMaxLabel,
  unitHpMax,
  unitHpMaxLabel,
} from './unitHpMax';

describe('unitHpMax', () => {
  it('reads catalog max HP for a known unit', () => {
    const n = unitHpMax('scavenger');
    expect(n).toBe(getUnitType('scavenger').maxHp);
    expect(unitHpMaxLabel('scavenger')).toBe(t('sel.hpMaxTip', { n: n! }));
    expect(sharedUnitHpMaxLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.hpMaxTip', { n: n! }),
    );
    expect(sharedUnitHpMaxLabel(['scavenger', 'tin_knight'])).toBeNull();
  });
});
