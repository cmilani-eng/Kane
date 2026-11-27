import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import {
  attackRangeLabel,
  attackRangeTiles,
  sharedUnitAttackRangeLabel,
  unitAttackRange,
  unitAttackRangeLabel,
} from './unitAttackRange';
import { unitMoveSpeedLabel } from './unitMoveSpeed';
import { unitProjectileSpeedLabel } from './unitProjectileSpeed';
import { unitSplashRadiusLabel } from './unitSplashRadius';
import { unitVisionLabel } from './unitVision';

describe('unitAttackRange', () => {
  it('converts world-pixel range to map tiles', () => {
    expect(attackRangeTiles(MAP.tile)).toBe(1);
    expect(attackRangeTiles(MAP.tile * 3)).toBe(3);
    expect(attackRangeTiles(0)).toBe(0);
  });

  it('labels Range · n with middot, distinct from Proj · / Atk CD · / Splash · / Speed · / Sight ·', () => {
    const def = getUnitType('scavenger');
    const n = attackRangeTiles(def.range);
    expect(n).toBeGreaterThan(0);
    expect(attackRangeLabel(def.range)).toBe(t('sel.rangeTip', { n }));
    expect(unitAttackRange('scavenger')).toBe(n);
    expect(unitAttackRangeLabel('scavenger')).toBe(t('sel.rangeTip', { n }));
    expect(unitAttackRangeLabel('scavenger')).toBe(`Range · ${n}`);
    expect(unitAttackRangeLabel('scavenger')).toMatch(/^Range \u00b7 /);

    const range = unitAttackRangeLabel('rock_thrower')!;
    expect(range).toBe(
      t('sel.rangeTip', { n: unitAttackRange('rock_thrower')! }),
    );
    expect(range).toMatch(/^Range \u00b7 /);
    expect(range).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(range).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(range).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(range).not.toBe(unitMoveSpeedLabel('rock_thrower'));
    expect(range).not.toBe(unitVisionLabel('rock_thrower'));
    expect(range).not.toMatch(/^Proj \u00b7 /);
    expect(range).not.toMatch(/^Atk CD \u00b7 /);
    expect(range).not.toMatch(/^Splash \u00b7 /);
    expect(range).not.toMatch(/^Speed \u00b7 /);
    expect(range).not.toMatch(/^Sight \u00b7 /);

    // Splash peer on an AoE unit still differs by prefix.
    const splashUnit = unitAttackRangeLabel('big_bonker')!;
    expect(splashUnit).toMatch(/^Range \u00b7 /);
    expect(splashUnit).not.toBe(unitSplashRadiusLabel('big_bonker'));
    expect(splashUnit).not.toMatch(/^Splash \u00b7 /);

    expect(unitAttackRangeLabel('scavenger')).not.toBe(
      unitVisionLabel('scavenger'),
    );
    expect(sharedUnitAttackRangeLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.rangeTip', { n }),
    );
    expect(
      sharedUnitAttackRangeLabel(['scavenger', 'boom_goblin']),
    ).toBeNull();
    expect(sharedUnitAttackRangeLabel([])).toBeNull();
  });

  it('localizes Range middot for pt-BR and es; stays distinct from Proj / Atk CD / Splash / Speed', () => {
    setLocale('pt-BR');
    const nPt = unitAttackRange('scavenger')!;
    expect(unitAttackRangeLabel('scavenger')).toBe(
      t('sel.rangeTip', { n: nPt }),
    );
    expect(unitAttackRangeLabel('scavenger')).toBe(`Alcance · ${nPt}`);
    expect(unitAttackRangeLabel('scavenger')).toMatch(/^Alcance \u00b7 /);

    const rangePt = unitAttackRangeLabel('rock_thrower')!;
    expect(rangePt).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(rangePt).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(rangePt).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(rangePt).not.toBe(unitMoveSpeedLabel('rock_thrower'));
    expect(rangePt).not.toMatch(/^Proj \u00b7 /);
    expect(rangePt).not.toMatch(/^CD atq\. ·/);
    expect(rangePt).not.toMatch(/^Área \u00b7 /);
    expect(rangePt).not.toMatch(/^Velocidade \u00b7 /);
    expect(unitAttackRangeLabel('big_bonker')).not.toBe(
      unitSplashRadiusLabel('big_bonker'),
    );

    setLocale('es');
    const nEs = unitAttackRange('scavenger')!;
    expect(unitAttackRangeLabel('scavenger')).toBe(
      t('sel.rangeTip', { n: nEs }),
    );
    expect(unitAttackRangeLabel('scavenger')).toBe(`Alcance · ${nEs}`);
    expect(unitAttackRangeLabel('scavenger')).toMatch(/^Alcance \u00b7 /);

    const rangeEs = unitAttackRangeLabel('rock_thrower')!;
    expect(rangeEs).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(rangeEs).not.toBe(unitAttackCooldownLabel('rock_thrower'));
    expect(rangeEs).not.toBe(unitSplashRadiusLabel('rock_thrower'));
    expect(rangeEs).not.toBe(unitMoveSpeedLabel('rock_thrower'));
    expect(rangeEs).not.toMatch(/^Proy \u00b7 /);
    expect(rangeEs).not.toMatch(/^CD atq\. ·/);
    expect(rangeEs).not.toMatch(/^Área \u00b7 /);
    expect(rangeEs).not.toMatch(/^Velocidad \u00b7 /);
    expect(unitAttackRangeLabel('big_bonker')).not.toBe(
      unitSplashRadiusLabel('big_bonker'),
    );
    setLocale('en-GB');
  });
});
