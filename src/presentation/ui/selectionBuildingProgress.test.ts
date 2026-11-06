import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { buildRemainSec } from './selectionPanel';

describe('incomplete building selection copy', () => {
  it('formats construction percent with remaining seconds', () => {
    const line = t('sel.buildingPct', { pct: 42, sec: 3 });
    expect(line).toContain('42');
    expect(line).toContain('3s');
    expect(t('sel.hpStat', { hp: 80, max: 200 })).toContain('80');
    expect(t('sel.hpStat', { hp: 80, max: 200 })).toContain('200');
  });
});

describe('buildRemainSec', () => {
  it('ceils leftover construction time from progress', () => {
    expect(buildRemainSec(5000, 0)).toBe(5);
    expect(buildRemainSec(5000, 0.2)).toBe(4);
    expect(buildRemainSec(5000, 0.999)).toBe(1);
    expect(buildRemainSec(5000, 1)).toBe(0);
  });

  it('returns zero when buildMs is missing or complete', () => {
    expect(buildRemainSec(0, 0.5)).toBe(0);
    expect(buildRemainSec(4000, 1.2)).toBe(0);
  });
});
