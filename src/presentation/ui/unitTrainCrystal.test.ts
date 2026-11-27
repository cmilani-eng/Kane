import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { unitDpsLabel } from './unitDps';
import { unitHpMaxLabel } from './unitHpMax';
import { unitSupplyCostLabel } from './unitSupplyCost';
import { unitTrainGoldLabel } from './unitTrainGold';
import {
  sharedUnitTrainCrystalLabel,
  unitTrainCrystal,
  unitTrainCrystalLabel,
} from './unitTrainCrystal';

describe('unitTrainCrystal', () => {
  it('labels Crystal · n with middot, distinct from Gold · / Supply · / Max HP · / DPS ·', () => {
    const n = unitTrainCrystal('rock_thrower');
    expect(n).toBe(getUnitType('rock_thrower').costCrystals);
    expect(n).toBeGreaterThan(0);
    const line = unitTrainCrystalLabel('rock_thrower')!;
    expect(line).toBe(t('sel.trainCrystalTip', { n: n! }));
    expect(line).toBe(`Crystal · ${n}`);
    expect(line).toMatch(/^Crystal \u00b7 /);
    expect(line).not.toBe(t('sel.crystalCost', { n: n! }));
    expect(line).not.toBe(unitTrainGoldLabel('rock_thrower'));
    expect(line).not.toBe(unitSupplyCostLabel('rock_thrower'));
    expect(line).not.toBe(unitHpMaxLabel('rock_thrower'));
    expect(line).not.toBe(unitDpsLabel('rock_thrower'));
    expect(line).not.toMatch(/^Gold \u00b7 /);
    expect(line).not.toMatch(/^Supply \u00b7 /);
    expect(line).not.toMatch(/^Max HP \u00b7 /);
    expect(line).not.toMatch(/^DPS \u00b7 /);

    expect(sharedUnitTrainCrystalLabel(['rock_thrower', 'rock_thrower'])).toBe(
      t('sel.trainCrystalTip', { n: n! }),
    );
    expect(
      sharedUnitTrainCrystalLabel(['rock_thrower', 'scavenger']),
    ).toBeNull();
    expect(sharedUnitTrainCrystalLabel([])).toBeNull();
  });

  it('localizes Crystal middot for pt-BR and es; stays distinct from Gold / Supply / Max HP / DPS', () => {
    const n = unitTrainCrystal('rock_thrower')!;

    setLocale('pt-BR');
    const pt = unitTrainCrystalLabel('rock_thrower')!;
    expect(pt).toBe(t('sel.trainCrystalTip', { n }));
    expect(pt).toBe(`Cristal · ${n}`);
    expect(pt).toMatch(/^Cristal \u00b7 /);
    expect(pt).not.toBe(t('sel.crystalCost', { n }));
    expect(pt).not.toBe(unitTrainGoldLabel('rock_thrower'));
    expect(pt).not.toBe(unitSupplyCostLabel('rock_thrower'));
    expect(pt).not.toBe(unitHpMaxLabel('rock_thrower'));
    expect(pt).not.toBe(unitDpsLabel('rock_thrower'));
    expect(pt).not.toMatch(/^Ouro \u00b7 /);
    expect(pt).not.toMatch(/^Suprimento \u00b7 /);
    expect(pt).not.toMatch(/^PV máx\. \u00b7 /);
    expect(pt).not.toMatch(/^DPS \u00b7 /);

    setLocale('es');
    const es = unitTrainCrystalLabel('rock_thrower')!;
    expect(es).toBe(t('sel.trainCrystalTip', { n }));
    expect(es).toBe(`Cristal · ${n}`);
    expect(es).toMatch(/^Cristal \u00b7 /);
    expect(es).not.toBe(t('sel.crystalCost', { n }));
    expect(es).not.toBe(unitTrainGoldLabel('rock_thrower'));
    expect(es).not.toBe(unitSupplyCostLabel('rock_thrower'));
    expect(es).not.toBe(unitHpMaxLabel('rock_thrower'));
    expect(es).not.toBe(unitDpsLabel('rock_thrower'));
    expect(es).not.toMatch(/^Oro \u00b7 /);
    expect(es).not.toMatch(/^Suministro \u00b7 /);
    expect(es).not.toMatch(/^PV máx\. \u00b7 /);
    expect(es).not.toMatch(/^DPS \u00b7 /);
    setLocale('en-GB');
  });

  it('omits the tip when catalog crystal cost is zero', () => {
    expect(unitTrainCrystal('scavenger')).toBeNull();
    expect(unitTrainCrystalLabel('scavenger')).toBeNull();
  });
});
