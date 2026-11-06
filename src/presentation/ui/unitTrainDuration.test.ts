import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  sharedUnitTrainDurationLabel,
  unitTrainDurationLabel,
  unitTrainDurationSec,
} from './unitTrainDuration';

describe('unitTrainDuration', () => {
  it('ceils catalog trainMs to whole seconds', () => {
    const ms = getUnitType('bonker').trainMs;
    expect(ms).toBeGreaterThan(0);
    expect(unitTrainDurationSec('bonker')).toBe(Math.ceil(ms / 1000));
    expect(unitTrainDurationLabel('bonker')).toBe(
      t('sel.trainDurationTip', { n: unitTrainDurationSec('bonker')! }),
    );
  });

  it('shares a tip only when every selected unit is the same type', () => {
    const tip = unitTrainDurationLabel('bonker');
    expect(sharedUnitTrainDurationLabel(['bonker', 'bonker'])).toBe(tip);
    expect(sharedUnitTrainDurationLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitTrainDurationLabel([])).toBeNull();
  });
});
