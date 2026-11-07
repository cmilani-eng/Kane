import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { unitSplashRadiusPx } from '../../data/unitSplashRadius';
import { setLocale, t } from '../../i18n';
import { unitAttackRangeLabel } from './unitAttackRange';
import { unitAttackTypeLabel } from './unitAttackType';
import { unitDamageLabel } from './unitDamage';
import {
  sharedUnitSplashRadiusLabel,
  splashRadiusTiles,
  unitSplashRadius,
  unitSplashRadiusLabel,
} from './unitSplashRadius';

describe('unitSplashRadius', () => {
  it('converts world-pixel splash to map tiles', () => {
    expect(splashRadiusTiles(MAP.tile)).toBe(1);
    expect(splashRadiusTiles(MAP.tile * 2)).toBe(2);
    expect(splashRadiusTiles(0)).toBe(0);
  });

  it('labels Splash · n from catalog AoE units, distinct from Range / Damage / Atk type', () => {
    const px = unitSplashRadiusPx('big_bonker');
    expect(px).toBeGreaterThan(0);
    const n = splashRadiusTiles(px!);
    expect(unitSplashRadius('big_bonker')).toBe(n);
    expect(unitSplashRadiusLabel('big_bonker')).toBe(t('sel.splashTip', { n }));
    expect(unitSplashRadiusLabel('big_bonker')).toBe(`Splash · ${n}`);
    expect(unitSplashRadiusLabel('big_bonker')).toMatch(/^Splash \u00b7 /);

    expect(unitSplashRadiusLabel('boom_goblin')).toMatch(/^Splash \u00b7 /);
    expect(unitSplashRadiusLabel('boom_cart')).toMatch(/^Splash \u00b7 /);
    expect(unitSplashRadiusLabel('crystal_freak')).toMatch(/^Splash \u00b7 /);

    // Non-splash units omit.
    expect(unitSplashRadius('bonker')).toBeNull();
    expect(unitSplashRadiusLabel('bonker')).toBeNull();
    expect(unitSplashRadius('scavenger')).toBeNull();

    const splash = unitSplashRadiusLabel('big_bonker')!;
    expect(splash).not.toBe(unitAttackRangeLabel('big_bonker'));
    expect(splash).not.toBe(unitDamageLabel('big_bonker'));
    expect(splash).not.toBe(unitAttackTypeLabel('big_bonker'));
    expect(splash).not.toMatch(/^Range \u00b7 /);
    expect(splash).not.toMatch(/^Damage \u00b7 /);
    expect(splash).not.toMatch(/^Atk \u00b7 /);
  });

  it('localizes Splash middot for pt-BR and es; stays distinct from Range / Damage / Atk', () => {
    setLocale('pt-BR');
    const nPt = unitSplashRadius('boom_goblin')!;
    expect(unitSplashRadiusLabel('boom_goblin')).toBe(
      t('sel.splashTip', { n: nPt }),
    );
    expect(unitSplashRadiusLabel('boom_goblin')).toBe(`Área · ${nPt}`);
    expect(unitSplashRadiusLabel('boom_goblin')).toMatch(/^Área \u00b7 /);
    expect(unitSplashRadiusLabel('boom_goblin')).not.toBe(
      unitAttackRangeLabel('boom_goblin'),
    );
    expect(unitSplashRadiusLabel('boom_goblin')).not.toBe(
      unitDamageLabel('boom_goblin'),
    );
    expect(unitSplashRadiusLabel('boom_goblin')).not.toBe(
      unitAttackTypeLabel('boom_goblin'),
    );
    expect(unitSplashRadiusLabel('boom_goblin')).not.toMatch(/^Alcance \u00b7 /);
    expect(unitSplashRadiusLabel('boom_goblin')).not.toMatch(/^Dano \u00b7 /);
    expect(unitSplashRadiusLabel('boom_goblin')).not.toMatch(/^Atq \u00b7 /);

    setLocale('es');
    const nEs = unitSplashRadius('boom_cart')!;
    expect(unitSplashRadiusLabel('boom_cart')).toBe(
      t('sel.splashTip', { n: nEs }),
    );
    expect(unitSplashRadiusLabel('boom_cart')).toBe(`Área · ${nEs}`);
    expect(unitSplashRadiusLabel('boom_cart')).toMatch(/^Área \u00b7 /);
    expect(unitSplashRadiusLabel('boom_cart')).not.toBe(
      unitAttackRangeLabel('boom_cart'),
    );
    expect(unitSplashRadiusLabel('boom_cart')).not.toBe(
      unitDamageLabel('boom_cart'),
    );
    expect(unitSplashRadiusLabel('boom_cart')).not.toBe(
      unitAttackTypeLabel('boom_cart'),
    );
    expect(unitSplashRadiusLabel('boom_cart')).not.toMatch(/^Alcance \u00b7 /);
    expect(unitSplashRadiusLabel('boom_cart')).not.toMatch(/^Daño \u00b7 /);
    expect(unitSplashRadiusLabel('boom_cart')).not.toMatch(/^Atq \u00b7 /);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit matches splash tiles', () => {
    expect(sharedUnitSplashRadiusLabel(['boom_goblin', 'boom_goblin'])).toBe(
      unitSplashRadiusLabel('boom_goblin'),
    );
    expect(
      sharedUnitSplashRadiusLabel(['boom_goblin', 'big_bonker']),
    ).toBeNull();
    expect(sharedUnitSplashRadiusLabel(['boom_goblin', 'bonker'])).toBeNull();
    expect(sharedUnitSplashRadiusLabel([])).toBeNull();
  });
});
