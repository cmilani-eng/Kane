import { describe, expect, it } from 'vitest';
import { getBuildingType } from '../../data/buildings';
import { setLocale, t } from '../../i18n';
import { buildingHpMax, buildingHpMaxLabel } from './buildingHpMax';
import { selectionHpRatioTipLine } from './selectionHpRatioTip';
import { unitHpMaxLabel } from './unitHpMax';

describe('buildingHpMax', () => {
  it('labels Max HP · n from catalog, distinct from HP · pct%', () => {
    const id = 'junkyard' as const;
    const n = buildingHpMax(id);
    expect(n).toBe(getBuildingType(id).maxHp);
    expect(n).toBe(1200);
    expect(buildingHpMaxLabel(id)).toBe(t('sel.hpMaxTip', { n: n! }));
    expect(buildingHpMaxLabel(id)).toBe('Max HP · 1200');
    expect(buildingHpMaxLabel(id)).toMatch(/^Max HP \u00b7 /);
    expect(buildingHpMaxLabel(id)).not.toBe(
      selectionHpRatioTipLine(1200, 1200),
    );
    expect(buildingHpMaxLabel(id)).not.toBe(t('sel.hpRatioTip', { n: 100 }));
    // Same key/format as unit tip (shared sel.hpMaxTip).
    expect(buildingHpMaxLabel(id)).toBe(t('sel.hpMaxTip', { n: 1200 }));
    expect(unitHpMaxLabel('scavenger')).toMatch(/^Max HP \u00b7 /);
  });

  it('localizes Max HP middot for pt-BR and es', () => {
    const id = 'junkyard' as const;
    setLocale('pt-BR');
    expect(buildingHpMaxLabel(id)).toBe(t('sel.hpMaxTip', { n: 1200 }));
    expect(buildingHpMaxLabel(id)).toBe('PV máx. · 1200');
    expect(buildingHpMaxLabel(id)).toMatch(/^PV máx\. \u00b7 /);
    setLocale('es');
    expect(buildingHpMaxLabel(id)).toBe(t('sel.hpMaxTip', { n: 1200 }));
    expect(buildingHpMaxLabel(id)).toBe('PV máx. · 1200');
    expect(buildingHpMaxLabel(id)).toMatch(/^PV máx\. \u00b7 /);
    setLocale('en-GB');
  });
});
