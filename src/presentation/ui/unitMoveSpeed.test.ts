import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import { unitAttackSpeedLabel } from './unitAttackSpeed';
import { unitMoveCadenceLabel } from './unitMoveCadence';
import {
  moveSpeedTilesPerSec,
  sharedUnitMoveSpeedLabel,
  unitMoveSpeed,
  unitMoveSpeedLabel,
} from './unitMoveSpeed';
import { unitProjectileSpeedLabel } from './unitProjectileSpeed';
import { unitSplashRadiusLabel } from './unitSplashRadius';

describe('unitMoveSpeed', () => {
  it('converts world-pixel speed to tiles per second', () => {
    expect(moveSpeedTilesPerSec(MAP.tile)).toBe(1);
    expect(moveSpeedTilesPerSec(MAP.tile * 2.5)).toBe(2.5);
    expect(moveSpeedTilesPerSec(0)).toBeNull();
  });

  it('labels Speed · n with middot, distinct from Proj · / Atk CD · / Splash · / Pace · / Rate ·', () => {
    const n = unitMoveSpeed('scavenger');
    expect(n).toBe(moveSpeedTilesPerSec(getUnitType('scavenger').speed));
    expect(unitMoveSpeedLabel('scavenger')).toBe(t('sel.speedTip', { n: n! }));
    expect(unitMoveSpeedLabel('scavenger')).toBe(`Speed · ${n}`);
    expect(unitMoveSpeedLabel('scavenger')).toMatch(/^Speed \u00b7 /);

    const speed = unitMoveSpeedLabel('rock_thrower')!;
    expect(speed).toBe(
      t('sel.speedTip', { n: unitMoveSpeed('rock_thrower')! }),
    );
    expect(speed).toMatch(/^Speed \u00b7 /);
    expect(speed).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(speed).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(speed).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(speed).not.toBe(unitMoveCadenceLabel('rock_thrower'));
    expect(speed).not.toBe(unitAttackSpeedLabel('rock_thrower'));
    expect(speed).not.toMatch(/^Proj \u00b7 /);
    expect(speed).not.toMatch(/^Atk CD \u00b7 /);
    expect(speed).not.toMatch(/^Splash \u00b7 /);
    expect(speed).not.toMatch(/^Pace \u00b7 /);
    expect(speed).not.toMatch(/^Rate \u00b7 /);

    // Splash peer on an AoE unit still differs by prefix.
    const splashUnit = unitMoveSpeedLabel('big_bonker')!;
    expect(splashUnit).toMatch(/^Speed \u00b7 /);
    expect(splashUnit).not.toBe(unitSplashRadiusLabel('big_bonker'));
    expect(splashUnit).not.toMatch(/^Splash \u00b7 /);

    expect(sharedUnitMoveSpeedLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.speedTip', { n: n! }),
    );
    expect(sharedUnitMoveSpeedLabel(['scavenger', 'tin_knight'])).toBeNull();
    expect(sharedUnitMoveSpeedLabel([])).toBeNull();
  });

  it('localizes Speed middot for pt-BR and es; stays distinct from Proj / Atk CD / Splash', () => {
    setLocale('pt-BR');
    const nPt = unitMoveSpeed('scavenger')!;
    expect(unitMoveSpeedLabel('scavenger')).toBe(
      t('sel.speedTip', { n: nPt }),
    );
    expect(unitMoveSpeedLabel('scavenger')).toBe(`Velocidade · ${nPt}`);
    expect(unitMoveSpeedLabel('scavenger')).toMatch(/^Velocidade \u00b7 /);

    const speedPt = unitMoveSpeedLabel('rock_thrower')!;
    expect(speedPt).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(speedPt).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(speedPt).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(speedPt).not.toMatch(/^Proj \u00b7 /);
    expect(speedPt).not.toMatch(/^CD atq\. ·/);
    expect(speedPt).not.toMatch(/^Área \u00b7 /);
    expect(unitMoveSpeedLabel('big_bonker')).not.toBe(
      unitSplashRadiusLabel('big_bonker'),
    );

    setLocale('es');
    const nEs = unitMoveSpeed('scavenger')!;
    expect(unitMoveSpeedLabel('scavenger')).toBe(
      t('sel.speedTip', { n: nEs }),
    );
    expect(unitMoveSpeedLabel('scavenger')).toBe(`Velocidad · ${nEs}`);
    expect(unitMoveSpeedLabel('scavenger')).toMatch(/^Velocidad \u00b7 /);

    const speedEs = unitMoveSpeedLabel('rock_thrower')!;
    expect(speedEs).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(speedEs).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(speedEs).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(speedEs).not.toMatch(/^Proy \u00b7 /);
    expect(speedEs).not.toMatch(/^CD atq\. ·/);
    expect(speedEs).not.toMatch(/^Área \u00b7 /);
    expect(unitMoveSpeedLabel('big_bonker')).not.toBe(
      unitSplashRadiusLabel('big_bonker'),
    );
    setLocale('en-GB');
  });
});
