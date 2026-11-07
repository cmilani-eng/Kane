import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import {
  attackSpeedPerSec,
  sharedUnitAttackSpeedLabel,
  unitAttackSpeed,
  unitAttackSpeedLabel,
} from './unitAttackSpeed';
import { unitDamageLabel } from './unitDamage';
import { unitDpsLabel } from './unitDps';
import { unitHealRateLabel } from './unitHealRate';
import { unitMoveCadenceLabel } from './unitMoveCadence';
import { unitMoveSpeedLabel } from './unitMoveSpeed';

describe('unitAttackSpeed', () => {
  it('is attacks-per-second from catalog cooldown', () => {
    expect(attackSpeedPerSec(1000)).toBe(1);
    expect(attackSpeedPerSec(500)).toBe(2);
    expect(attackSpeedPerSec(0)).toBeNull();
    const n = unitAttackSpeed('scavenger');
    expect(n).toBe(
      attackSpeedPerSec(getUnitType('scavenger').attackCooldownMs),
    );
  });

  it('labels Rate · n/s with middot, distinct from Atk CD · / DPS · / Heal · / Damage · / Speed · / Pace ·', () => {
    const n = unitAttackSpeed('scavenger')!;
    expect(n).toBe(1.1);
    const line = unitAttackSpeedLabel('scavenger')!;
    expect(line).toBe(t('sel.atkSpeedTip', { n }));
    expect(line).toBe('Rate · 1.1/s');
    expect(line).toMatch(/^Rate \u00b7 /);
    expect(line).toMatch(/\/s$/);
    expect(line).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(line).not.toBe(unitDpsLabel('scavenger'));
    expect(line).not.toBe(unitDamageLabel('scavenger'));
    expect(line).not.toBe(unitMoveSpeedLabel('scavenger'));
    expect(line).not.toBe(unitMoveCadenceLabel('scavenger'));
    expect(line).not.toMatch(/^Atk CD \u00b7 /);
    expect(line).not.toMatch(/^DPS \u00b7 /);
    expect(line).not.toMatch(/^Damage \u00b7 /);
    expect(line).not.toMatch(/^Speed \u00b7 /);
    expect(line).not.toMatch(/^Pace \u00b7 /);

    // Heal peer on a hero that also has an attack rate.
    const heroRate = unitAttackSpeedLabel('boniface')!;
    expect(heroRate).toMatch(/^Rate \u00b7 /);
    expect(heroRate).not.toBe(unitHealRateLabel('boniface'));
    expect(heroRate).not.toMatch(/^Heal \u00b7 /);
  });

  it('localizes Rate middot for pt-BR and es; stays distinct from Atk CD / DPS / Heal / Damage / Speed / Pace', () => {
    const n = unitAttackSpeed('scavenger')!;

    setLocale('pt-BR');
    const pt = unitAttackSpeedLabel('scavenger')!;
    expect(pt).toBe(t('sel.atkSpeedTip', { n }));
    expect(pt).toBe('Cadência · 1.1/s');
    expect(pt).toMatch(/^Cadência \u00b7 /);
    expect(pt).toMatch(/\/s$/);
    expect(pt).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(pt).not.toBe(unitDpsLabel('scavenger'));
    expect(pt).not.toBe(unitDamageLabel('scavenger'));
    expect(pt).not.toBe(unitMoveSpeedLabel('scavenger'));
    expect(pt).not.toBe(unitMoveCadenceLabel('scavenger'));
    expect(pt).not.toMatch(/^CD atq\. ·/);
    expect(pt).not.toMatch(/^DPS \u00b7 /);
    expect(pt).not.toMatch(/^Dano \u00b7 /);
    expect(pt).not.toMatch(/^Velocidade \u00b7 /);
    expect(pt).not.toMatch(/^Ritmo \u00b7 /);
    expect(unitAttackSpeedLabel('boniface')).not.toBe(
      unitHealRateLabel('boniface'),
    );
    expect(unitAttackSpeedLabel('boniface')).not.toMatch(/^Cura \u00b7 /);

    setLocale('es');
    const es = unitAttackSpeedLabel('scavenger')!;
    expect(es).toBe(t('sel.atkSpeedTip', { n }));
    expect(es).toBe('Cadencia · 1.1/s');
    expect(es).toMatch(/^Cadencia \u00b7 /);
    expect(es).toMatch(/\/s$/);
    expect(es).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(es).not.toBe(unitDpsLabel('scavenger'));
    expect(es).not.toBe(unitDamageLabel('scavenger'));
    expect(es).not.toBe(unitMoveSpeedLabel('scavenger'));
    expect(es).not.toBe(unitMoveCadenceLabel('scavenger'));
    expect(es).not.toMatch(/^CD atq\. ·/);
    expect(es).not.toMatch(/^DPS \u00b7 /);
    expect(es).not.toMatch(/^Daño \u00b7 /);
    expect(es).not.toMatch(/^Velocidad \u00b7 /);
    expect(es).not.toMatch(/^Ritmo \u00b7 /);
    expect(unitAttackSpeedLabel('boniface')).not.toBe(
      unitHealRateLabel('boniface'),
    );
    expect(unitAttackSpeedLabel('boniface')).not.toMatch(/^Cura \u00b7 /);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit is the same type', () => {
    expect(sharedUnitAttackSpeedLabel(['bonker', 'bonker'])).toBe(
      unitAttackSpeedLabel('bonker'),
    );
    expect(sharedUnitAttackSpeedLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitAttackSpeedLabel([])).toBeNull();
  });
});
