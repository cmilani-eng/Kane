import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  sharedUnitVisionLabel,
  unitVision,
  unitVisionLabel,
  visionTiles,
} from './unitVision';

describe('unitVision', () => {
  it('converts world-pixel vision to map tiles', () => {
    expect(visionTiles(MAP.tile)).toBe(1);
    expect(visionTiles(MAP.tile * 5)).toBe(5);
    expect(visionTiles(0)).toBe(0);
  });

  it('labels catalog vision for a known unit', () => {
    const n = unitVision('scavenger');
    expect(n).toBe(visionTiles(getUnitType('scavenger').vision));
    expect(unitVisionLabel('scavenger')).toBe(t('sel.visionTip', { n: n! }));
    expect(sharedUnitVisionLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.visionTip', { n: n! }),
    );
    expect(sharedUnitVisionLabel(['scavenger', 'tin_knight'])).toBeNull();
  });
});
