import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import {
  attackSpeedPerSec,
  sharedUnitAttackSpeedLabel,
  unitAttackSpeed,
  unitAttackSpeedLabel,
} from './unitAttackSpeed';

describe('unitAttackSpeed', () => {
  it('is attacks-per-second from catalog cooldown', () => {
    expect(attackSpeedPerSec(1000)).toBe(1);
    expect(attackSpeedPerSec(500)).toBe(2);
    expect(attackSpeedPerSec(0)).toBeNull();
    const n = unitAttackSpeed('scavenger');
    expect(n).toBe(
      attackSpeedPerSec(getUnitType('scavenger').attackCooldownMs),
    );
    expect(unitAttackSpeedLabel('scavenger')).toBe(
      t('sel.atkSpeedTip', { n: n! }),
    );
    expect(unitAttackSpeedLabel('scavenger')).toMatch(/^Rate ·/);
    expect(unitAttackSpeedLabel('scavenger')).not.toBe(
      unitAttackCooldownLabel('scavenger'),
    );
  });

  it('shares a tip only when every selected unit is the same type', () => {
    expect(sharedUnitAttackSpeedLabel(['bonker', 'bonker'])).toBe(
      unitAttackSpeedLabel('bonker'),
    );
    expect(sharedUnitAttackSpeedLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitAttackSpeedLabel([])).toBeNull();
  });
});
