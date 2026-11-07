import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  buildingGhostSectorAt,
  buildingGhostSectorTip,
} from './buildingGhostSectorTip';

describe('buildingGhostSectorTip', () => {
  it('maps world position to a 3×3 sector', () => {
    expect(buildingGhostSectorAt(100, 100)).toBe('NW');
    expect(buildingGhostSectorAt(1200, 800)).toBe('C');
  });

  it('labels the last-seen sector (distinct from age)', () => {
    expect(buildingGhostSectorTip(100, 100)).toBe(
      t('hud.ghostSector', { sector: 'NW' }),
    );
    expect(buildingGhostSectorTip(100, 100)).not.toMatch(/\d+s/);
  });
});
