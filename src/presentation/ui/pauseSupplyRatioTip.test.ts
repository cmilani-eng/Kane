import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { formatSupplyLine } from './supplyTone';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';

describe('pauseSupplyRatioTipLine', () => {
  it('labels Supply · used/cap distinct from formatSupplyLine', () => {
    const tip = pauseSupplyRatioTipLine(18, 36);
    expect(tip).toBe(t('pause.supplyRatioTip', { used: 18, cap: 36 }));
    expect(tip).toMatch(/^Supply ·/);
    expect(tip).toContain('18/36');
    expect(tip).not.toBe(formatSupplyLine(18, 36));
  });
});
