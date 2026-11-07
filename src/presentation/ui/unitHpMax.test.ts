import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { selectionHpRatioTipLine } from './selectionHpRatioTip';
import {
  sharedUnitHpMaxLabel,
  unitHpMax,
  unitHpMaxLabel,
} from './unitHpMax';

describe('unitHpMax', () => {
  it('labels Max HP · n from catalog, distinct from HP · pct%', () => {
    const n = unitHpMax('scavenger');
    expect(n).toBe(getUnitType('scavenger').maxHp);
    expect(n).toBe(55);
    expect(unitHpMaxLabel('scavenger')).toBe(t('sel.hpMaxTip', { n: n! }));
    expect(unitHpMaxLabel('scavenger')).toBe('Max HP · 55');
    expect(unitHpMaxLabel('scavenger')).toMatch(/^Max HP \u00b7 /);
    expect(unitHpMaxLabel('scavenger')).not.toBe(
      selectionHpRatioTipLine(55, 55),
    );
    expect(unitHpMaxLabel('scavenger')).not.toBe(
      t('sel.hpRatioTip', { n: 100 }),
    );
    expect(unitHpMaxLabel('scavenger')).not.toBe(
      t('sel.hpStat', { hp: 55, max: 55 }),
    );
    expect(sharedUnitHpMaxLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.hpMaxTip', { n: n! }),
    );
    expect(sharedUnitHpMaxLabel(['scavenger', 'tin_knight'])).toBeNull();
    expect(sharedUnitHpMaxLabel([])).toBeNull();
  });

  it('localizes Max HP middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(unitHpMaxLabel('scavenger')).toBe(t('sel.hpMaxTip', { n: 55 }));
    expect(unitHpMaxLabel('scavenger')).toBe('PV máx. · 55');
    expect(unitHpMaxLabel('scavenger')).toMatch(/^PV máx\. \u00b7 /);
    setLocale('es');
    expect(unitHpMaxLabel('scavenger')).toBe(t('sel.hpMaxTip', { n: 55 }));
    expect(unitHpMaxLabel('scavenger')).toBe('PV máx. · 55');
    expect(unitHpMaxLabel('scavenger')).toMatch(/^PV máx\. \u00b7 /);
    setLocale('en-GB');
  });
});
