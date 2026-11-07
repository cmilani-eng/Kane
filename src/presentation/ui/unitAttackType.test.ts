import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  sharedUnitAttackTypeLabel,
  unitAttackType,
  unitAttackTypeLabel,
} from './unitAttackType';

describe('unitAttackType', () => {
  it('classifies melee vs ranged from catalog reach', () => {
    expect(unitAttackType('bonker')).toBe('melee');
    expect(unitAttackType('rock_thrower')).toBe('ranged');
    expect(unitAttackTypeLabel('bonker')).toBe(
      t('sel.atkTypeTip', { type: t('sel.atkType.melee') }),
    );
    expect(unitAttackTypeLabel('bolt_boy')).toBe(
      t('sel.atkTypeTip', { type: t('sel.atkType.ranged') }),
    );
  });

  it('shares a tip only when every selected unit matches', () => {
    expect(sharedUnitAttackTypeLabel(['bonker', 'tin_knight'])).toBe(
      unitAttackTypeLabel('bonker'),
    );
    expect(sharedUnitAttackTypeLabel(['bonker', 'rock_thrower'])).toBeNull();
    expect(sharedUnitAttackTypeLabel([])).toBeNull();
  });
});
