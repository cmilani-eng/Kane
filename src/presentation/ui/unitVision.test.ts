import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { endVisionTipLine } from './endVisionTip';
import { minimapVisionTipText } from './minimapVisionTip';
import { unitAttackRangeLabel } from './unitAttackRange';
import { unitMoveSpeedLabel } from './unitMoveSpeed';
import { unitProjectileSpeedLabel } from './unitProjectileSpeed';
import {
  sharedUnitVisionLabel,
  unitVision,
  unitVisionLabel,
  visionTiles,
} from './unitVision';

describe('unitVision', () => {
  it('converts world-pixel vision to map tiles', () => {
    expect(visionTiles(MAP.tile)).toBe(1);
    expect(visionTiles(MAP.tile * 5)).toBe(5);
    expect(visionTiles(0)).toBe(0);
  });

  it('labels Sight · n with middot, distinct from Range · / Speed · / Proj · / Vision ·', () => {
    const n = unitVision('scavenger');
    expect(n).toBe(visionTiles(getUnitType('scavenger').vision));
    expect(n).toBeGreaterThan(0);
    expect(unitVisionLabel('scavenger')).toBe(t('sel.visionTip', { n: n! }));
    expect(unitVisionLabel('scavenger')).toBe(`Sight · ${n}`);
    expect(unitVisionLabel('scavenger')).toMatch(/^Sight \u00b7 /);

    const sight = unitVisionLabel('rock_thrower')!;
    expect(sight).toBe(
      t('sel.visionTip', { n: unitVision('rock_thrower')! }),
    );
    expect(sight).toMatch(/^Sight \u00b7 /);
    expect(sight).not.toBe(unitAttackRangeLabel('rock_thrower'));
    expect(sight).not.toBe(unitMoveSpeedLabel('rock_thrower'));
    expect(sight).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(sight).not.toMatch(/^Range \u00b7 /);
    expect(sight).not.toMatch(/^Speed \u00b7 /);
    expect(sight).not.toMatch(/^Proj \u00b7 /);
    expect(sight).not.toMatch(/^Vision \u00b7 /);

    // Same tile count still differs from minimap / end Vision · tips.
    const tiles = unitVision('scavenger')!;
    expect(unitVisionLabel('scavenger')).not.toBe(minimapVisionTipText(tiles));
    expect(unitVisionLabel('scavenger')).not.toBe(endVisionTipLine(tiles));
    expect(minimapVisionTipText(tiles)).toMatch(/^Vision \u00b7 /);
    expect(endVisionTipLine(tiles)).toMatch(/^Vision \u00b7 /);

    expect(sharedUnitVisionLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.visionTip', { n: n! }),
    );
    expect(sharedUnitVisionLabel(['scavenger', 'tin_knight'])).toBeNull();
    expect(sharedUnitVisionLabel([])).toBeNull();
  });

  it('localizes Sight middot for pt-BR and es; stays distinct from Range / Speed / Proj', () => {
    setLocale('pt-BR');
    const nPt = unitVision('scavenger')!;
    expect(unitVisionLabel('scavenger')).toBe(
      t('sel.visionTip', { n: nPt }),
    );
    expect(unitVisionLabel('scavenger')).toBe(`Visão · ${nPt}`);
    expect(unitVisionLabel('scavenger')).toMatch(/^Visão \u00b7 /);

    const sightPt = unitVisionLabel('rock_thrower')!;
    expect(sightPt).not.toBe(unitAttackRangeLabel('rock_thrower'));
    expect(sightPt).not.toBe(unitMoveSpeedLabel('rock_thrower'));
    expect(sightPt).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(sightPt).not.toMatch(/^Alcance \u00b7 /);
    expect(sightPt).not.toMatch(/^Velocidade \u00b7 /);
    expect(sightPt).not.toMatch(/^Proj \u00b7 /);

    setLocale('es');
    const nEs = unitVision('scavenger')!;
    expect(unitVisionLabel('scavenger')).toBe(
      t('sel.visionTip', { n: nEs }),
    );
    expect(unitVisionLabel('scavenger')).toBe(`Visión · ${nEs}`);
    expect(unitVisionLabel('scavenger')).toMatch(/^Visión \u00b7 /);

    const sightEs = unitVisionLabel('rock_thrower')!;
    expect(sightEs).not.toBe(unitAttackRangeLabel('rock_thrower'));
    expect(sightEs).not.toBe(unitMoveSpeedLabel('rock_thrower'));
    expect(sightEs).not.toBe(unitProjectileSpeedLabel('rock_thrower'));
    expect(sightEs).not.toMatch(/^Alcance \u00b7 /);
    expect(sightEs).not.toMatch(/^Velocidad \u00b7 /);
    expect(sightEs).not.toMatch(/^Proy \u00b7 /);
    setLocale('en-GB');
  });
});
