import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import {
  sharedUnitAttackTypeLabel,
  unitAttackType,
  unitAttackTypeLabel,
} from './unitAttackType';
import { unitDamageLabel } from './unitDamage';
import { unitDpsLabel } from './unitDps';

describe('unitAttackType', () => {
  it('classifies melee vs ranged from catalog reach', () => {
    expect(unitAttackType('bonker')).toBe('melee');
    expect(unitAttackType('rock_thrower')).toBe('ranged');
  });

  it('labels Atk · type with middot, distinct from Damage / DPS / Atk CD', () => {
    expect(unitAttackTypeLabel('bonker')).toBe(
      t('sel.atkTypeTip', { type: t('sel.atkType.melee') }),
    );
    expect(unitAttackTypeLabel('bonker')).toBe('Atk · Melee');
    expect(unitAttackTypeLabel('bonker')).toMatch(/^Atk \u00b7 /);
    expect(unitAttackTypeLabel('bolt_boy')).toBe('Atk · Ranged');
    expect(unitAttackTypeLabel('bolt_boy')).toMatch(/^Atk \u00b7 /);
    expect(unitAttackTypeLabel('bonker')).not.toBe(unitDamageLabel('bonker'));
    expect(unitAttackTypeLabel('bonker')).not.toBe(unitDpsLabel('bonker'));
    expect(unitAttackTypeLabel('bonker')).not.toBe(
      unitAttackCooldownLabel('bonker'),
    );
    expect(unitAttackTypeLabel('bonker')).not.toMatch(/\d/);
  });

  it('localizes Atk · type middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(unitAttackTypeLabel('bonker')).toBe(
      t('sel.atkTypeTip', { type: t('sel.atkType.melee') }),
    );
    expect(unitAttackTypeLabel('bonker')).toBe('Atq · Corpo a corpo');
    expect(unitAttackTypeLabel('bonker')).toMatch(/^Atq \u00b7 /);
    expect(unitAttackTypeLabel('bonker')).not.toBe(unitDamageLabel('bonker'));
    expect(unitAttackTypeLabel('bonker')).not.toBe(unitDpsLabel('bonker'));
    expect(unitAttackTypeLabel('bonker')).not.toBe(
      unitAttackCooldownLabel('bonker'),
    );

    setLocale('es');
    expect(unitAttackTypeLabel('bolt_boy')).toBe(
      t('sel.atkTypeTip', { type: t('sel.atkType.ranged') }),
    );
    expect(unitAttackTypeLabel('bolt_boy')).toBe('Atq · A distancia');
    expect(unitAttackTypeLabel('bolt_boy')).toMatch(/^Atq \u00b7 /);
    expect(unitAttackTypeLabel('bolt_boy')).not.toBe(
      unitDamageLabel('bolt_boy'),
    );
    expect(unitAttackTypeLabel('bolt_boy')).not.toBe(unitDpsLabel('bolt_boy'));
    expect(unitAttackTypeLabel('bolt_boy')).not.toBe(
      unitAttackCooldownLabel('bolt_boy'),
    );
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit matches', () => {
    expect(sharedUnitAttackTypeLabel(['bonker', 'tin_knight'])).toBe(
      unitAttackTypeLabel('bonker'),
    );
    expect(sharedUnitAttackTypeLabel(['bonker', 'rock_thrower'])).toBeNull();
    expect(sharedUnitAttackTypeLabel([])).toBeNull();
  });
});
