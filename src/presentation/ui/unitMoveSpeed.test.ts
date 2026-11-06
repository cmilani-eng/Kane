import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  moveSpeedTilesPerSec,
  sharedUnitMoveSpeedLabel,
  unitMoveSpeed,
  unitMoveSpeedLabel,
} from './unitMoveSpeed';

describe('unitMoveSpeed', () => {
  it('converts world-pixel speed to tiles per second', () => {
    expect(moveSpeedTilesPerSec(MAP.tile)).toBe(1);
    expect(moveSpeedTilesPerSec(MAP.tile * 2.5)).toBe(2.5);
    expect(moveSpeedTilesPerSec(0)).toBeNull();
  });

  it('labels catalog speed for a known unit', () => {
    const n = unitMoveSpeed('scavenger');
    expect(n).toBe(moveSpeedTilesPerSec(getUnitType('scavenger').speed));
    expect(unitMoveSpeedLabel('scavenger')).toBe(t('sel.speedTip', { n: n! }));
    expect(sharedUnitMoveSpeedLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.speedTip', { n: n! }),
    );
    expect(sharedUnitMoveSpeedLabel(['scavenger', 'tin_knight'])).toBeNull();
  });
});
