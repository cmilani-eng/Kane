import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { selectionHpRatioTipLine } from './selectionHpRatioTip';
import { unitAttackRangeLabel } from './unitAttackRange';
import { unitDpsLabel } from './unitDps';
import {
  sharedUnitHpMaxLabel,
  unitHpMax,
  unitHpMaxLabel,
} from './unitHpMax';
import { unitSupplyCostLabel } from './unitSupplyCost';

describe('unitHpMax', () => {
  it('labels Max HP · n with middot, distinct from Supply · / DPS · / Range · / HP · pct%', () => {
    const n = unitHpMax('scavenger');
    expect(n).toBe(getUnitType('scavenger').maxHp);
    expect(n).toBe(55);
    const line = unitHpMaxLabel('scavenger')!;
    expect(line).toBe(t('sel.hpMaxTip', { n: n! }));
    expect(line).toBe('Max HP · 55');
    expect(line).toMatch(/^Max HP \u00b7 /);
    expect(line).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(line).not.toBe(unitDpsLabel('scavenger'));
    expect(line).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(line).not.toBe(selectionHpRatioTipLine(55, 55));
    expect(line).not.toBe(t('sel.hpRatioTip', { n: 100 }));
    expect(line).not.toBe(t('sel.hpStat', { hp: 55, max: 55 }));
    expect(line).not.toMatch(/^Supply \u00b7 /);
    expect(line).not.toMatch(/^DPS \u00b7 /);
    expect(line).not.toMatch(/^Range \u00b7 /);
    expect(line).not.toMatch(/^HP \u00b7 /);
    expect(sharedUnitHpMaxLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.hpMaxTip', { n: n! }),
    );
    expect(sharedUnitHpMaxLabel(['scavenger', 'tin_knight'])).toBeNull();
    expect(sharedUnitHpMaxLabel([])).toBeNull();
  });

  it('localizes Max HP middot for pt-BR and es; stays distinct from Supply / DPS / Range / HP · pct%', () => {
    const n = unitHpMax('scavenger')!;

    setLocale('pt-BR');
    const pt = unitHpMaxLabel('scavenger')!;
    expect(pt).toBe(t('sel.hpMaxTip', { n }));
    expect(pt).toBe('PV máx. · 55');
    expect(pt).toMatch(/^PV máx\. \u00b7 /);
    expect(pt).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(pt).not.toBe(unitDpsLabel('scavenger'));
    expect(pt).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(pt).not.toBe(selectionHpRatioTipLine(55, 55));
    expect(pt).not.toMatch(/^Suprimento \u00b7 /);
    expect(pt).not.toMatch(/^DPS \u00b7 /);
    expect(pt).not.toMatch(/^Alcance \u00b7 /);
    expect(pt).not.toMatch(/^PV \u00b7 /);

    setLocale('es');
    const es = unitHpMaxLabel('scavenger')!;
    expect(es).toBe(t('sel.hpMaxTip', { n }));
    expect(es).toBe('PV máx. · 55');
    expect(es).toMatch(/^PV máx\. \u00b7 /);
    expect(es).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(es).not.toBe(unitDpsLabel('scavenger'));
    expect(es).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(es).not.toBe(selectionHpRatioTipLine(55, 55));
    expect(es).not.toMatch(/^Suministro \u00b7 /);
    expect(es).not.toMatch(/^DPS \u00b7 /);
    expect(es).not.toMatch(/^Alcance \u00b7 /);
    expect(es).not.toMatch(/^PV \u00b7 /);
    setLocale('en-GB');
  });
});
