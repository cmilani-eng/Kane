import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { unitDpsLabel } from './unitDps';
import { unitHpMaxLabel } from './unitHpMax';
import { unitSupplyCostLabel } from './unitSupplyCost';
import {
  sharedUnitTrainGoldLabel,
  unitTrainGold,
  unitTrainGoldLabel,
} from './unitTrainGold';

describe('unitTrainGold', () => {
  it('labels Gold · n with middot, distinct from Supply · / Max HP · / DPS ·', () => {
    const n = unitTrainGold('scavenger');
    expect(n).toBe(getUnitType('scavenger').costGold);
    const line = unitTrainGoldLabel('scavenger')!;
    expect(line).toBe(t('sel.trainGoldTip', { n: n! }));
    expect(line).toBe(`Gold · ${n}`);
    expect(line).toMatch(/^Gold \u00b7 /);
    expect(line).not.toBe(t('sel.goldCost', { n: n! }));
    expect(line).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(line).not.toBe(unitHpMaxLabel('scavenger'));
    expect(line).not.toBe(unitDpsLabel('scavenger'));
    expect(line).not.toMatch(/^Supply \u00b7 /);
    expect(line).not.toMatch(/^Max HP \u00b7 /);
    expect(line).not.toMatch(/^DPS \u00b7 /);

    expect(sharedUnitTrainGoldLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.trainGoldTip', { n: n! }),
    );
    expect(sharedUnitTrainGoldLabel(['scavenger', 'tin_knight'])).toBeNull();
    expect(sharedUnitTrainGoldLabel([])).toBeNull();
  });

  it('localizes Gold middot for pt-BR and es; stays distinct from Supply / Max HP / DPS', () => {
    const n = unitTrainGold('scavenger')!;

    setLocale('pt-BR');
    const pt = unitTrainGoldLabel('scavenger')!;
    expect(pt).toBe(t('sel.trainGoldTip', { n }));
    expect(pt).toBe(`Ouro · ${n}`);
    expect(pt).toMatch(/^Ouro \u00b7 /);
    expect(pt).not.toBe(t('sel.goldCost', { n }));
    expect(pt).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(pt).not.toBe(unitHpMaxLabel('scavenger'));
    expect(pt).not.toBe(unitDpsLabel('scavenger'));
    expect(pt).not.toMatch(/^Suprimento \u00b7 /);
    expect(pt).not.toMatch(/^PV máx\. \u00b7 /);
    expect(pt).not.toMatch(/^DPS \u00b7 /);

    setLocale('es');
    const es = unitTrainGoldLabel('scavenger')!;
    expect(es).toBe(t('sel.trainGoldTip', { n }));
    expect(es).toBe(`Oro · ${n}`);
    expect(es).toMatch(/^Oro \u00b7 /);
    expect(es).not.toBe(t('sel.goldCost', { n }));
    expect(es).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(es).not.toBe(unitHpMaxLabel('scavenger'));
    expect(es).not.toBe(unitDpsLabel('scavenger'));
    expect(es).not.toMatch(/^Suministro \u00b7 /);
    expect(es).not.toMatch(/^PV máx\. \u00b7 /);
    expect(es).not.toMatch(/^DPS \u00b7 /);
    setLocale('en-GB');
  });
});
