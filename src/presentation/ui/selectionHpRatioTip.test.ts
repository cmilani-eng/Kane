import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  selectionHpRatioPercent,
  selectionHpRatioTipLine,
} from './selectionHpRatioTip';

describe('selectionHpRatioTipLine', () => {
  it('labels HP · pct% from current/max', () => {
    expect(selectionHpRatioPercent(50, 100)).toBe(50);
    expect(selectionHpRatioTipLine(50, 100)).toBe(
      t('sel.hpRatioTip', { n: 50 }),
    );
    expect(selectionHpRatioTipLine(50, 100)).toMatch(/^HP ·/);
    expect(selectionHpRatioTipLine(0, 100)).toBe(
      t('sel.hpRatioTip', { n: 0 }),
    );
    expect(selectionHpRatioTipLine(10, 0)).toBeNull();
  });
});
