import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  selectionHpRatioPercent,
  selectionHpRatioTipLine,
} from './selectionHpRatioTip';
import { unitHpMaxLabel } from './unitHpMax';

describe('selectionHpRatioTipLine', () => {
  it('labels HP · pct% from current/max, distinct from Max HP tip', () => {
    expect(selectionHpRatioPercent(50, 100)).toBe(50);
    expect(selectionHpRatioTipLine(50, 100)).toBe(
      t('sel.hpRatioTip', { n: 50 }),
    );
    expect(selectionHpRatioTipLine(50, 100)).toMatch(/^HP ·/);
    expect(selectionHpRatioTipLine(50, 100)).toMatch(/%$/);
    expect(selectionHpRatioTipLine(0, 100)).toBe(
      t('sel.hpRatioTip', { n: 0 }),
    );
    expect(selectionHpRatioTipLine(10, 0)).toBeNull();
    expect(selectionHpRatioTipLine(50, 100)).not.toBe(
      unitHpMaxLabel('scavenger'),
    );
    expect(unitHpMaxLabel('scavenger')).toMatch(/^Max HP /);
  });
});
