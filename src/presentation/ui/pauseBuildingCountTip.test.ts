import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseBuildingCountTipLine } from './pauseBuildingCountTip';

describe('pauseBuildingCountTipLine', () => {
  it('labels Buildings · n, distinct from Army tip', () => {
    expect(pauseBuildingCountTipLine(4)).toBe(
      t('pause.buildingsTip', { n: 4 }),
    );
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Buildings ·/);
    expect(pauseBuildingCountTipLine(0)).toBe(
      t('pause.buildingsTip', { n: 0 }),
    );
    expect(pauseBuildingCountTipLine(4)).not.toBe(pauseArmySizeTipLine(4));
    // Same en copy as minimap buildings tip; distinct i18n key / surface.
    expect(pauseBuildingCountTipLine(4)).toBe(minimapBuildingCountTipText(4));
  });
});
