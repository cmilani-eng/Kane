import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  attackCooldownSec,
  sharedUnitAttackCooldownLabel,
  unitAttackCooldown,
  unitAttackCooldownLabel,
} from './unitAttackCooldown';

describe('unitAttackCooldown', () => {
  it('converts attack cooldown ms to seconds', () => {
    expect(attackCooldownSec(900)).toBe(0.9);
    expect(attackCooldownSec(1000)).toBe(1);
    expect(attackCooldownSec(0)).toBeNull();
  });

  it('labels catalog attack cooldown for a known unit', () => {
    const n = unitAttackCooldown('scavenger');
    expect(n).toBe(attackCooldownSec(getUnitType('scavenger').attackCooldownMs));
    expect(unitAttackCooldownLabel('scavenger')).toBe(
      t('sel.atkCdTip', { n: n! }),
    );
    expect(sharedUnitAttackCooldownLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.atkCdTip', { n: n! }),
    );
    expect(
      sharedUnitAttackCooldownLabel(['scavenger', 'tin_knight']),
    ).toBeNull();
  });
});
