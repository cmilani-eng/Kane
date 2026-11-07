import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';

describe('minimapArmyCountTipText', () => {
  it('labels Army · n, distinct surface from pause Army tip', () => {
    expect(minimapArmyCountTipText(5)).toBe(t('hud.minimapArmy', { n: 5 }));
    expect(minimapArmyCountTipText(5)).toMatch(/^Army ·/);
    expect(minimapArmyCountTipText(0)).toBe(t('hud.minimapArmy', { n: 0 }));
    // Same en copy as pause tip; distinct i18n key / surface.
    expect(minimapArmyCountTipText(5)).toBe(pauseArmySizeTipLine(5));
    expect(minimapArmyCountTipText(5)).not.toBe(t('hud.armyCount', { n: 5 }));
  });
});
