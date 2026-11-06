import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';

describe('incomplete building selection copy', () => {
  it('formats construction percent and HP stats', () => {
    expect(t('sel.buildingPct', { pct: 42 })).toContain('42');
    expect(t('sel.hpStat', { hp: 80, max: 200 })).toContain('80');
    expect(t('sel.hpStat', { hp: 80, max: 200 })).toContain('200');
  });
});
