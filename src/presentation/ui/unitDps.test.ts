import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import { unitAttackRangeLabel } from './unitAttackRange';
import { unitAttackSpeedLabel } from './unitAttackSpeed';
import { unitDamageLabel } from './unitDamage';
import { sharedUnitDpsLabel, unitDps, unitDpsLabel } from './unitDps';
import { unitProjectileSpeedLabel } from './unitProjectileSpeed';
import { unitSplashRadiusLabel } from './unitSplashRadius';

describe('unitDps', () => {
  it('rounds catalog dmg over attack cooldown to whole DPS', () => {
    // scavenger: dmg 4, cd 900ms → 4.44 → 4
    expect(unitDps('scavenger')).toBe(4);
    // boom_goblin-ish checks via tin_knight: dmg from data
    expect(unitDps('tin_knight')).toBeGreaterThan(0);
  });

  it('labels DPS · n with middot, distinct from Atk CD · / Proj · / Splash · / Range ·', () => {
    const n = unitDps('scavenger');
    expect(n).not.toBeNull();
    const line = unitDpsLabel('scavenger');
    expect(line).toBe(t('sel.dps', { n: n! }));
    expect(line).toBe(`DPS · ${n}`);
    expect(line).toMatch(/^DPS \u00b7 /);
    expect(line).not.toBe(unitDamageLabel('scavenger'));
    expect(line).not.toBe(unitAttackSpeedLabel('scavenger'));
    expect(line).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(line).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(line).not.toMatch(/^Atk CD \u00b7 /);
    expect(line).not.toMatch(/^Range \u00b7 /);

    const ranged = unitDpsLabel('rock_thrower')!;
    expect(ranged).toBe(
      t('sel.dps', { n: unitDps('rock_thrower')! }),
    );
    expect(ranged).toMatch(/^DPS \u00b7 /);
    expect(ranged).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(ranged).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(ranged).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(ranged).not.toBe(unitAttackRangeLabel('rock_thrower'));
    expect(ranged).not.toMatch(/^Proj \u00b7 /);
    expect(ranged).not.toMatch(/^Atk CD \u00b7 /);
    expect(ranged).not.toMatch(/^Splash \u00b7 /);
    expect(ranged).not.toMatch(/^Range \u00b7 /);

    // Splash peer on an AoE unit still differs by prefix.
    const splashUnit = unitDpsLabel('big_bonker')!;
    expect(splashUnit).toMatch(/^DPS \u00b7 /);
    expect(splashUnit).not.toBe(unitSplashRadiusLabel('big_bonker'));
    expect(splashUnit).not.toBe(unitAttackRangeLabel('big_bonker'));
    expect(splashUnit).not.toBe(unitAttackCooldownLabel('big_bonker'));
    expect(splashUnit).not.toMatch(/^Splash \u00b7 /);
    expect(splashUnit).not.toMatch(/^Range \u00b7 /);
    expect(splashUnit).not.toMatch(/^Atk CD \u00b7 /);
  });

  it('localizes DPS middot for pt-BR and es; stays distinct from Atk CD / Proj / Splash / Range', () => {
    setLocale('pt-BR');
    const nPt = unitDps('scavenger')!;
    expect(unitDpsLabel('scavenger')).toBe(t('sel.dps', { n: nPt }));
    expect(unitDpsLabel('scavenger')).toBe(`DPS · ${nPt}`);
    expect(unitDpsLabel('scavenger')).toMatch(/^DPS \u00b7 /);

    const dpsPt = unitDpsLabel('rock_thrower')!;
    expect(dpsPt).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(dpsPt).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(dpsPt).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(dpsPt).not.toBe(unitAttackRangeLabel('rock_thrower'));
    expect(dpsPt).not.toMatch(/^Proj \u00b7 /);
    expect(dpsPt).not.toMatch(/^CD atq\. ·/);
    expect(dpsPt).not.toMatch(/^Área \u00b7 /);
    expect(dpsPt).not.toMatch(/^Alcance \u00b7 /);
    expect(unitDpsLabel('big_bonker')).not.toBe(
      unitSplashRadiusLabel('big_bonker'),
    );

    setLocale('es');
    const nEs = unitDps('scavenger')!;
    expect(unitDpsLabel('scavenger')).toBe(t('sel.dps', { n: nEs }));
    expect(unitDpsLabel('scavenger')).toBe(`DPS · ${nEs}`);
    expect(unitDpsLabel('scavenger')).toMatch(/^DPS \u00b7 /);

    const dpsEs = unitDpsLabel('rock_thrower')!;
    expect(dpsEs).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(dpsEs).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(dpsEs).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(dpsEs).not.toBe(unitAttackRangeLabel('rock_thrower'));
    expect(dpsEs).not.toMatch(/^Proy \u00b7 /);
    expect(dpsEs).not.toMatch(/^CD atq\. ·/);
    expect(dpsEs).not.toMatch(/^Área \u00b7 /);
    expect(dpsEs).not.toMatch(/^Alcance \u00b7 /);
    expect(unitDpsLabel('big_bonker')).not.toBe(
      unitSplashRadiusLabel('big_bonker'),
    );
    setLocale('en-GB');
  });

  it('shares tip only for same-type selections', () => {
    expect(sharedUnitDpsLabel(['bonker', 'bonker'])).toBe(
      unitDpsLabel('bonker'),
    );
    expect(sharedUnitDpsLabel(['bonker', 'rock_thrower'])).toBeNull();
    expect(sharedUnitDpsLabel([])).toBeNull();
  });
});
