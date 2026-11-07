import { describe, expect, it } from 'vitest';
import { COMBAT, MAP } from '../../config/balance';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import { unitAttackTypeLabel } from './unitAttackType';
import { unitMoveSpeedLabel } from './unitMoveSpeed';
import { unitSplashRadiusLabel } from './unitSplashRadius';
import {
  projectileSpeedTilesPerSec,
  sharedUnitProjectileSpeedLabel,
  unitProjectileSpeed,
  unitProjectileSpeedLabel,
} from './unitProjectileSpeed';

describe('unitProjectileSpeed', () => {
  it('converts world-pixel projectile speed to tiles per second', () => {
    expect(projectileSpeedTilesPerSec(MAP.tile)).toBe(1);
    expect(projectileSpeedTilesPerSec(MAP.tile * 2.5)).toBe(2.5);
    expect(projectileSpeedTilesPerSec(COMBAT.projectileSpeed)).toBe(8);
    expect(projectileSpeedTilesPerSec(0)).toBeNull();
  });

  it('labels Proj · n for ranged units, distinct from Atk CD / Splash / Atk type', () => {
    const n = unitProjectileSpeed('rock_thrower');
    expect(n).toBe(projectileSpeedTilesPerSec(COMBAT.projectileSpeed));
    expect(unitProjectileSpeedLabel('rock_thrower')).toBe(
      t('sel.projTip', { n: n! }),
    );
    expect(unitProjectileSpeedLabel('rock_thrower')).toBe(`Proj · ${n}`);
    expect(unitProjectileSpeedLabel('rock_thrower')).toMatch(/^Proj \u00b7 /);

    expect(unitProjectileSpeedLabel('bolt_boy')).toMatch(/^Proj \u00b7 /);
    expect(unitProjectileSpeedLabel('eyebat')).toMatch(/^Proj \u00b7 /);
    expect(unitProjectileSpeedLabel('shroom_mage')).toMatch(/^Proj \u00b7 /);

    // Melee / non-ranged omit.
    expect(unitProjectileSpeed('bonker')).toBeNull();
    expect(unitProjectileSpeedLabel('bonker')).toBeNull();
    expect(unitProjectileSpeed('scavenger')).toBeNull();
    expect(unitProjectileSpeedLabel('big_bonker')).toBeNull();

    const proj = unitProjectileSpeedLabel('rock_thrower')!;
    expect(proj).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(proj).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(proj).not.toBe(unitAttackTypeLabel('rock_thrower'));
    expect(proj).not.toBe(unitMoveSpeedLabel('rock_thrower'));
    expect(proj).not.toMatch(/^Atk CD \u00b7 /);
    expect(proj).not.toMatch(/^Splash \u00b7 /);
    expect(proj).not.toMatch(/^Atk \u00b7 /);
    expect(proj).not.toMatch(/^Speed \u00b7 /);
  });

  it('localizes Proj middot for pt-BR and es; stays distinct from Atk CD / Splash / Atk', () => {
    setLocale('pt-BR');
    const nPt = unitProjectileSpeed('bolt_boy')!;
    expect(unitProjectileSpeedLabel('bolt_boy')).toBe(
      t('sel.projTip', { n: nPt }),
    );
    expect(unitProjectileSpeedLabel('bolt_boy')).toBe(`Proj · ${nPt}`);
    expect(unitProjectileSpeedLabel('bolt_boy')).toMatch(/^Proj \u00b7 /);
    expect(unitProjectileSpeedLabel('bolt_boy')).not.toBe(
      unitAttackCooldownLabel('bolt_boy'),
    );
    expect(unitProjectileSpeedLabel('bolt_boy')).not.toBe(
      unitSplashRadiusLabel('bolt_boy'),
    );
    expect(unitProjectileSpeedLabel('bolt_boy')).not.toBe(
      unitAttackTypeLabel('bolt_boy'),
    );
    expect(unitProjectileSpeedLabel('bolt_boy')).not.toMatch(/^CD atq\. ·/);
    expect(unitProjectileSpeedLabel('bolt_boy')).not.toMatch(/^Área \u00b7 /);
    expect(unitProjectileSpeedLabel('bolt_boy')).not.toMatch(/^Atq \u00b7 /);

    setLocale('es');
    const nEs = unitProjectileSpeed('eyebat')!;
    expect(unitProjectileSpeedLabel('eyebat')).toBe(
      t('sel.projTip', { n: nEs }),
    );
    expect(unitProjectileSpeedLabel('eyebat')).toBe(`Proy · ${nEs}`);
    expect(unitProjectileSpeedLabel('eyebat')).toMatch(/^Proy \u00b7 /);
    expect(unitProjectileSpeedLabel('eyebat')).not.toBe(
      unitAttackCooldownLabel('eyebat'),
    );
    expect(unitProjectileSpeedLabel('eyebat')).not.toBe(
      unitSplashRadiusLabel('eyebat'),
    );
    expect(unitProjectileSpeedLabel('eyebat')).not.toBe(
      unitAttackTypeLabel('eyebat'),
    );
    expect(unitProjectileSpeedLabel('eyebat')).not.toMatch(/^CD atq\. ·/);
    expect(unitProjectileSpeedLabel('eyebat')).not.toMatch(/^Área \u00b7 /);
    expect(unitProjectileSpeedLabel('eyebat')).not.toMatch(/^Atq \u00b7 /);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit matches projectile tiles/s', () => {
    expect(
      sharedUnitProjectileSpeedLabel(['rock_thrower', 'bolt_boy']),
    ).toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(
      sharedUnitProjectileSpeedLabel(['rock_thrower', 'rock_thrower']),
    ).toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(
      sharedUnitProjectileSpeedLabel(['rock_thrower', 'bonker']),
    ).toBeNull();
    expect(sharedUnitProjectileSpeedLabel(['bonker', 'bonker'])).toBeNull();
    expect(sharedUnitProjectileSpeedLabel([])).toBeNull();
  });
});
