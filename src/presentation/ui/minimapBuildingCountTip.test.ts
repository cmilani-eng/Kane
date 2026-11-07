import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';
import { pauseBuildingCountTipLine } from './pauseBuildingCountTip';

describe('minimapBuildingCountTipText', () => {
  it('labels Buildings · n, distinct from army tip and pause tip key', () => {
    expect(minimapBuildingCountTipText(3)).toBe(
      t('hud.minimapBuildings', { n: 3 }),
    );
    expect(minimapBuildingCountTipText(3)).toMatch(/^Buildings ·/);
    expect(minimapBuildingCountTipText(0)).toBe(
      t('hud.minimapBuildings', { n: 0 }),
    );
    expect(minimapBuildingCountTipText(3)).not.toBe(minimapArmyCountTipText(3));
    // Same en copy as pause Buildings tip; distinct i18n key / surface.
    expect(minimapBuildingCountTipText(3)).toBe(pauseBuildingCountTipLine(3));
    expect(pauseBuildingCountTipLine(3)).toBe(t('pause.buildingsTip', { n: 3 }));
  });
});
