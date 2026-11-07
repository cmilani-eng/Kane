import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { minimapSupplyTipText } from './minimapSupplyTip';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';

describe('minimapSupplyTipText', () => {
  it('labels Supply · used/cap, distinct from Pop tip and pause tip key', () => {
    const tip = minimapSupplyTipText(18, 36);
    expect(tip).toBe(t('hud.minimapSupply', { used: 18, cap: 36 }));
    expect(tip).toMatch(/^Supply \u00b7/);
    expect(tip).toContain('18/36');
    expect(tip).not.toBe(minimapPopulationTipText(18));
    // Same en copy as pause tip; distinct i18n key / surface.
    expect(tip).toBe(pauseSupplyRatioTipLine(18, 36));
    expect(pauseSupplyRatioTipLine(18, 36)).toBe(
      t('pause.supplyRatioTip', { used: 18, cap: 36 }),
    );
  });
});
