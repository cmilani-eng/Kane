import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import { unitAttackSpeedLabel } from './unitAttackSpeed';
import { unitMoveCadenceLabel } from './unitMoveCadence';
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

  it('labels Speed · n from catalog, distinct from Pace / Rate tips', () => {
    const n = unitMoveSpeed('scavenger');
    expect(n).toBe(moveSpeedTilesPerSec(getUnitType('scavenger').speed));
    expect(unitMoveSpeedLabel('scavenger')).toBe(t('sel.speedTip', { n: n! }));
    expect(unitMoveSpeedLabel('scavenger')).toMatch(/^Speed \u00b7/);
    expect(unitMoveSpeedLabel('scavenger')).not.toBe(
      unitMoveCadenceLabel('scavenger'),
    );
    expect(unitMoveSpeedLabel('scavenger')).not.toBe(
      unitAttackSpeedLabel('scavenger'),
    );
    expect(sharedUnitMoveSpeedLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.speedTip', { n: n! }),
    );
    expect(sharedUnitMoveSpeedLabel(['scavenger', 'tin_knight'])).toBeNull();
  });
});
