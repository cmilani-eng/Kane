import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { t } from '../../i18n';
import { pauseCameraSectorTipLine } from './pauseCameraSectorTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';
import {
  pauseSelectedSectorAt,
  pauseSelectedSectorTipLine,
} from './pauseSelectedSectorTip';

describe('pauseSelectedSectorTip', () => {
  it('maps selection centroid to a 3×3 sector', () => {
    expect(pauseSelectedSectorAt([])).toBeNull();
    expect(pauseSelectedSectorAt([{ x: 0, y: 0 }])).toBe('NW');
    expect(
      pauseSelectedSectorAt([
        { x: MAP.width - 1, y: MAP.height - 1 },
        { x: MAP.width - 1, y: MAP.height - 1 },
      ]),
    ).toBe('SE');
    expect(
      pauseSelectedSectorAt([
        { x: 0, y: 0 },
        { x: MAP.width - 1, y: MAP.height - 1 },
      ]),
    ).toBe('C');
  });

  it('labels Focus · sector, distinct from Cam · / Selected ·', () => {
    const tip = pauseSelectedSectorTipLine('NW');
    expect(tip).toBe(t('pause.selectedSectorTip', { sector: 'NW' }));
    expect(tip).toMatch(/^Focus ·/);
    expect(tip).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(tip).not.toBe(pauseSelectionCountTipLine(1));
  });
});
