import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapSupplyTipText } from './minimapSupplyTip';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';
import { formatSupplyLine } from './supplyTone';

describe('pauseSupplyRatioTipLine', () => {
  it('labels Supply · used/cap, distinct from Pop / minimap / spaced-slash', () => {
    const tip = pauseSupplyRatioTipLine(18, 36);
    expect(tip).toBe(t('pause.supplyRatioTip', { used: 18, cap: 36 }));
    expect(tip).toMatch(/^Supply ·/);
    expect(tip).toContain('18/36');
    expect(tip).not.toBe(formatSupplyLine(18, 36));
    expect(tip).not.toBe(pausePopulationTipLine(18));
    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(tip).toBe(minimapSupplyTipText(18, 36));
  });
});
