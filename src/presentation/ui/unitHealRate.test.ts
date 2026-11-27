import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import { unitAttackSpeedLabel } from './unitAttackSpeed';
import { unitDamageLabel } from './unitDamage';
import { unitDpsLabel } from './unitDps';
import {
  sharedUnitHealRateLabel,
  unitHealRate,
  unitHealRateLabel,
} from './unitHealRate';

describe('unitHealRate', () => {
  it('labels Heal · n/s with middot, distinct from DPS · / Atk CD · / Rate · / Damage ·', () => {
    // 180 HP / 14s ≈ 13 HP/s
    expect(unitHealRate('boniface')).toBe(13);
    const line = unitHealRateLabel('boniface')!;
    expect(line).toBe(t('sel.healRateTip', { n: 13 }));
    expect(line).toBe('Heal · 13/s');
    expect(line).toMatch(/^Heal \u00b7 /);
    expect(line).toMatch(/\/s$/);
    expect(line).not.toBe(unitDpsLabel('boniface'));
    expect(line).not.toBe(unitAttackCooldownLabel('boniface'));
    expect(line).not.toBe(unitAttackSpeedLabel('boniface'));
    expect(line).not.toBe(unitDamageLabel('boniface'));
    expect(line).not.toBe(t('sel.cooldown', { n: 13 }));
    expect(line).not.toMatch(/^DPS \u00b7 /);
    expect(line).not.toMatch(/^Atk CD \u00b7 /);
    expect(line).not.toMatch(/^Rate \u00b7 /);
    expect(line).not.toMatch(/^Damage \u00b7 /);

    expect(unitHealRate('gruk')).toBeNull();
    expect(unitHealRateLabel('scavenger')).toBeNull();
  });

  it('localizes Heal middot for pt-BR and es; stays distinct from DPS / Atk CD / Rate / Damage', () => {
    setLocale('pt-BR');
    const pt = unitHealRateLabel('boniface')!;
    expect(pt).toBe(t('sel.healRateTip', { n: 13 }));
    expect(pt).toBe('Cura · 13/s');
    expect(pt).toMatch(/^Cura \u00b7 /);
    expect(pt).toMatch(/\/s$/);
    expect(pt).not.toBe(unitDpsLabel('boniface'));
    expect(pt).not.toBe(unitAttackCooldownLabel('boniface'));
    expect(pt).not.toBe(unitAttackSpeedLabel('boniface'));
    expect(pt).not.toBe(unitDamageLabel('boniface'));
    expect(pt).not.toBe(t('sel.cooldown', { n: 13 }));
    expect(pt).not.toMatch(/^DPS \u00b7 /);
    expect(pt).not.toMatch(/^CD atq\. ·/);
    expect(pt).not.toMatch(/^Cadência \u00b7 /);
    expect(pt).not.toMatch(/^Dano \u00b7 /);

    setLocale('es');
    const es = unitHealRateLabel('boniface')!;
    expect(es).toBe(t('sel.healRateTip', { n: 13 }));
    expect(es).toBe('Cura · 13/s');
    expect(es).toMatch(/^Cura \u00b7 /);
    expect(es).toMatch(/\/s$/);
    expect(es).not.toBe(unitDpsLabel('boniface'));
    expect(es).not.toBe(unitAttackCooldownLabel('boniface'));
    expect(es).not.toBe(unitAttackSpeedLabel('boniface'));
    expect(es).not.toBe(unitDamageLabel('boniface'));
    expect(es).not.toBe(t('sel.cooldown', { n: 13 }));
    expect(es).not.toMatch(/^DPS \u00b7 /);
    expect(es).not.toMatch(/^CD atq\. ·/);
    expect(es).not.toMatch(/^Cadencia \u00b7 /);
    expect(es).not.toMatch(/^Daño \u00b7 /);
    setLocale('en-GB');
  });

  it('shares the tip only when every selected unit matches', () => {
    expect(sharedUnitHealRateLabel(['boniface', 'boniface'])).toBe(
      unitHealRateLabel('boniface'),
    );
    expect(sharedUnitHealRateLabel(['boniface', 'gruk'])).toBeNull();
    expect(sharedUnitHealRateLabel([])).toBeNull();
  });
});
