import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import { unitAttackRangeLabel } from './unitAttackRange';
import {
  sharedUnitDamageLabel,
  unitDamage,
  unitDamageLabel,
} from './unitDamage';
import { unitDpsLabel } from './unitDps';
import { unitSplashRadiusLabel } from './unitSplashRadius';

describe('unitDamage', () => {
  it('labels Damage · n with middot, distinct from DPS · / Atk CD · / Splash · / Range ·', () => {
    const n = unitDamage('scavenger');
    expect(n).toBe(getUnitType('scavenger').dmg);
    const line = unitDamageLabel('scavenger')!;
    expect(line).toBe(t('sel.dmgTip', { n: n! }));
    expect(line).toBe(`Damage · ${n}`);
    expect(line).toMatch(/^Damage \u00b7 /);
    // Distinct from inline ATK chip (`ATK {n}`).
    expect(line).not.toBe(`${t('sel.atk')} ${n}`);
    expect(line).not.toBe(unitDpsLabel('scavenger'));
    expect(line).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(line).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(line).not.toMatch(/^DPS \u00b7 /);
    expect(line).not.toMatch(/^Atk CD \u00b7 /);
    expect(line).not.toMatch(/^Range \u00b7 /);

    // Splash peer on an AoE unit still differs by prefix.
    const splashUnit = unitDamageLabel('big_bonker')!;
    expect(splashUnit).toMatch(/^Damage \u00b7 /);
    expect(splashUnit).not.toBe(unitSplashRadiusLabel('big_bonker'));
    expect(splashUnit).not.toBe(unitDpsLabel('big_bonker'));
    expect(splashUnit).not.toBe(unitAttackCooldownLabel('big_bonker'));
    expect(splashUnit).not.toBe(unitAttackRangeLabel('big_bonker'));
    expect(splashUnit).not.toMatch(/^Splash \u00b7 /);
    expect(splashUnit).not.toMatch(/^DPS \u00b7 /);
    expect(splashUnit).not.toMatch(/^Atk CD \u00b7 /);
    expect(splashUnit).not.toMatch(/^Range \u00b7 /);

    expect(sharedUnitDamageLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.dmgTip', { n: n! }),
    );
    expect(sharedUnitDamageLabel(['scavenger', 'tin_knight'])).toBeNull();
    expect(sharedUnitDamageLabel([])).toBeNull();
  });

  it('localizes Damage middot for pt-BR and es; stays distinct from DPS / Atk CD / Splash / Range', () => {
    const n = unitDamage('scavenger')!;

    setLocale('pt-BR');
    const pt = unitDamageLabel('scavenger')!;
    expect(pt).toBe(t('sel.dmgTip', { n }));
    expect(pt).toBe(`Dano · ${n}`);
    expect(pt).toMatch(/^Dano \u00b7 /);
    expect(pt).not.toBe(`${t('sel.atk')} ${n}`);
    expect(pt).not.toBe(unitDpsLabel('scavenger'));
    expect(pt).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(pt).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(pt).not.toMatch(/^DPS \u00b7 /);
    expect(pt).not.toMatch(/^CD atq\. ·/);
    expect(pt).not.toMatch(/^Alcance \u00b7 /);
    expect(unitDamageLabel('big_bonker')).not.toBe(
      unitSplashRadiusLabel('big_bonker'),
    );
    expect(unitDamageLabel('big_bonker')).not.toMatch(/^Área \u00b7 /);

    setLocale('es');
    const es = unitDamageLabel('scavenger')!;
    expect(es).toBe(t('sel.dmgTip', { n }));
    expect(es).toBe(`Daño · ${n}`);
    expect(es).toMatch(/^Daño \u00b7 /);
    expect(es).not.toBe(`${t('sel.atk')} ${n}`);
    expect(es).not.toBe(unitDpsLabel('scavenger'));
    expect(es).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(es).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(es).not.toMatch(/^DPS \u00b7 /);
    expect(es).not.toMatch(/^CD atq\. ·/);
    expect(es).not.toMatch(/^Alcance \u00b7 /);
    expect(unitDamageLabel('big_bonker')).not.toBe(
      unitSplashRadiusLabel('big_bonker'),
    );
    expect(unitDamageLabel('big_bonker')).not.toMatch(/^Área \u00b7 /);
    setLocale('en-GB');
  });
});
