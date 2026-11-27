import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { unitAttackRangeLabel } from './unitAttackRange';
import { unitDpsLabel } from './unitDps';
import {
  selectionHpRatioPercent,
  selectionHpRatioTipLine,
} from './selectionHpRatioTip';
import { unitHpMaxLabel } from './unitHpMax';
import { unitSupplyCostLabel } from './unitSupplyCost';

describe('selectionHpRatioTipLine', () => {
  it('labels HP · pct% with middot, distinct from Max HP · / Supply · / DPS · / Range · / HP chip', () => {
    expect(selectionHpRatioPercent(50, 100)).toBe(50);
    expect(selectionHpRatioPercent(0, 100)).toBe(0);
    expect(selectionHpRatioPercent(10, 0)).toBeNull();

    const line = selectionHpRatioTipLine(50, 100)!;
    expect(line).toBe(t('sel.hpRatioTip', { n: 50 }));
    expect(line).toBe('HP · 50%');
    expect(line).toMatch(/^HP \u00b7 /);
    expect(line).toMatch(/%$/);
    expect(selectionHpRatioTipLine(0, 100)).toBe(t('sel.hpRatioTip', { n: 0 }));
    expect(selectionHpRatioTipLine(10, 0)).toBeNull();

    expect(line).not.toBe(unitHpMaxLabel('scavenger'));
    expect(line).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(line).not.toBe(unitDpsLabel('scavenger'));
    expect(line).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(line).not.toBe(t('sel.hpStat', { hp: 50, max: 100 }));
    expect(line).not.toMatch(/^Max HP \u00b7 /);
    expect(line).not.toMatch(/^Supply \u00b7 /);
    expect(line).not.toMatch(/^DPS \u00b7 /);
    expect(line).not.toMatch(/^Range \u00b7 /);
    expect(unitHpMaxLabel('scavenger')).toMatch(/^Max HP \u00b7 /);
    expect(unitHpMaxLabel('scavenger')).toBe('Max HP · 55');
  });

  it('localizes HP · pct% middot for pt-BR and es; stays distinct from Max HP / Supply / DPS / Range / HP chip', () => {
    setLocale('pt-BR');
    const pt = selectionHpRatioTipLine(50, 100)!;
    expect(pt).toBe(t('sel.hpRatioTip', { n: 50 }));
    expect(pt).toBe('PV · 50%');
    expect(pt).toMatch(/^PV \u00b7 /);
    expect(pt).toMatch(/%$/);
    expect(pt).not.toBe(unitHpMaxLabel('scavenger'));
    expect(pt).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(pt).not.toBe(unitDpsLabel('scavenger'));
    expect(pt).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(pt).not.toBe(t('sel.hpStat', { hp: 50, max: 100 }));
    expect(pt).not.toMatch(/^PV máx\. \u00b7 /);
    expect(pt).not.toMatch(/^Suprimento \u00b7 /);
    expect(pt).not.toMatch(/^DPS \u00b7 /);
    expect(pt).not.toMatch(/^Alcance \u00b7 /);

    setLocale('es');
    const es = selectionHpRatioTipLine(50, 100)!;
    expect(es).toBe(t('sel.hpRatioTip', { n: 50 }));
    expect(es).toBe('PV · 50%');
    expect(es).toMatch(/^PV \u00b7 /);
    expect(es).toMatch(/%$/);
    expect(es).not.toBe(unitHpMaxLabel('scavenger'));
    expect(es).not.toBe(unitSupplyCostLabel('scavenger'));
    expect(es).not.toBe(unitDpsLabel('scavenger'));
    expect(es).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(es).not.toBe(t('sel.hpStat', { hp: 50, max: 100 }));
    expect(es).not.toMatch(/^PV máx\. \u00b7 /);
    expect(es).not.toMatch(/^Suministro \u00b7 /);
    expect(es).not.toMatch(/^DPS \u00b7 /);
    expect(es).not.toMatch(/^Alcance \u00b7 /);
    setLocale('en-GB');
  });
});
