import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';

describe('minimapBuildingCountTipText', () => {
  it('labels Buildings · n', () => {
    expect(minimapBuildingCountTipText(3)).toBe(
      t('hud.minimapBuildings', { n: 3 }),
    );
    expect(minimapBuildingCountTipText(3)).toMatch(/^Buildings ·/);
    expect(minimapBuildingCountTipText(0)).toBe(
      t('hud.minimapBuildings', { n: 0 }),
    );
  });
});
