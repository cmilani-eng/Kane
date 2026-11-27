import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { unitAttackRangeLabel } from './unitAttackRange';
import { unitDpsLabel } from './unitDps';
import { unitHpMaxLabel } from './unitHpMax';
import {
  sharedUnitSupplyCostLabel,
  UNIT_SUPPLY_COST,
  unitSupplyCost,
  unitSupplyCostLabel,
} from './unitSupplyCost';

describe('unitSupplyCost', () => {
  it('labels Supply · n with middot, distinct from Max HP · / DPS · / Range ·', () => {
    expect(unitSupplyCost('scavenger')).toBe(UNIT_SUPPLY_COST);
    const line = unitSupplyCostLabel('scavenger');
    expect(line).toBe(t('sel.supplyTip', { n: UNIT_SUPPLY_COST }));
    expect(line).toBe('Supply · 1');
    expect(line).toMatch(/^Supply \u00b7 /);
    expect(line).not.toBe(unitHpMaxLabel('scavenger'));
    expect(line).not.toBe(unitDpsLabel('scavenger'));
    expect(line).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(line).not.toMatch(/^Max HP \u00b7 /);
    expect(line).not.toMatch(/^DPS \u00b7 /);
    expect(line).not.toMatch(/^Range \u00b7 /);

    expect(sharedUnitSupplyCostLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.supplyTip', { n: UNIT_SUPPLY_COST }),
    );
    expect(sharedUnitSupplyCostLabel(['scavenger', 'tin_knight'])).toBeNull();
    expect(sharedUnitSupplyCostLabel([])).toBeNull();
  });

  it('localizes Supply middot for pt-BR and es; stays distinct from Max HP / DPS / Range', () => {
    setLocale('pt-BR');
    const pt = unitSupplyCostLabel('scavenger');
    expect(pt).toBe(t('sel.supplyTip', { n: UNIT_SUPPLY_COST }));
    expect(pt).toBe('Suprimento · 1');
    expect(pt).toMatch(/^Suprimento \u00b7 /);
    expect(pt).not.toBe(unitHpMaxLabel('scavenger'));
    expect(pt).not.toBe(unitDpsLabel('scavenger'));
    expect(pt).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(pt).not.toMatch(/^PV máx\. \u00b7 /);
    expect(pt).not.toMatch(/^DPS \u00b7 /);
    expect(pt).not.toMatch(/^Alcance \u00b7 /);

    setLocale('es');
    const es = unitSupplyCostLabel('scavenger');
    expect(es).toBe(t('sel.supplyTip', { n: UNIT_SUPPLY_COST }));
    expect(es).toBe('Suministro · 1');
    expect(es).toMatch(/^Suministro \u00b7 /);
    expect(es).not.toBe(unitHpMaxLabel('scavenger'));
    expect(es).not.toBe(unitDpsLabel('scavenger'));
    expect(es).not.toBe(unitAttackRangeLabel('scavenger'));
    expect(es).not.toMatch(/^PV máx\. \u00b7 /);
    expect(es).not.toMatch(/^DPS \u00b7 /);
    expect(es).not.toMatch(/^Alcance \u00b7 /);
    setLocale('en-GB');
  });
});
