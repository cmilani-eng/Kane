import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pausePopulationTipLine } from './pausePopulationTip';

describe('pauseArmySizeTipLine', () => {
  it('labels Army · n, distinct from Pop tip', () => {
    expect(pauseArmySizeTipLine(7)).toBe(t('pause.armyTip', { n: 7 }));
    expect(pauseArmySizeTipLine(7)).toMatch(/^Army ·/);
    expect(pauseArmySizeTipLine(0)).toBe(t('pause.armyTip', { n: 0 }));
    expect(pauseArmySizeTipLine(7)).not.toBe(pausePopulationTipLine(7));
    // Same en copy as minimap army tip; distinct i18n key / surface.
    expect(pauseArmySizeTipLine(7)).toBe(minimapArmyCountTipText(7));
  });
});
