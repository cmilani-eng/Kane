import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';
import { minimapSupplyTipText } from './minimapSupplyTip';

describe('minimapSupplyTipText', () => {
  it('labels Supply · used/cap distinct from the pause tip key', () => {
    const tip = minimapSupplyTipText(18, 36);
    expect(tip).toBe(t('hud.minimapSupply', { used: 18, cap: 36 }));
    expect(tip).toMatch(/^Supply ·/);
    expect(tip).toContain('18');
    expect(tip).toContain('36');
    // Same English shape as pause, but dedicated minimap i18n key.
    expect(tip).toBe(pauseSupplyRatioTipLine(18, 36));
  });
});
