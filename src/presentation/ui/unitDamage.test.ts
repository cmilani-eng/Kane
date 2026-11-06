import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  sharedUnitDamageLabel,
  unitDamage,
  unitDamageLabel,
} from './unitDamage';

describe('unitDamage', () => {
  it('reads catalog attack damage for a known unit', () => {
    const n = unitDamage('bonker');
    expect(n).toBe(getUnitType('bonker').dmg);
    expect(unitDamageLabel('bonker')).toBe(t('sel.dmgTip', { n: n! }));
  });

  it('shares a tip only when every selected unit is the same type', () => {
    expect(sharedUnitDamageLabel(['bonker', 'bonker'])).toBe(
      unitDamageLabel('bonker'),
    );
    expect(sharedUnitDamageLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitDamageLabel([])).toBeNull();
  });
});
