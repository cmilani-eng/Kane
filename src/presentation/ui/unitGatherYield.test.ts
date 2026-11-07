import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  sharedUnitGatherYieldLabel,
  unitGatherYield,
  unitGatherYieldLabel,
} from './unitGatherYield';

describe('unitGatherYield', () => {
  it('labels worker haul capacity as Yield · n per trip', () => {
    expect(unitGatherYield('scavenger')).toBe(10);
    expect(unitGatherYieldLabel('scavenger')).toBe(
      t('sel.yieldTip', { n: 10 }),
    );
    expect(unitGatherYield('bonker')).toBeNull();
    expect(unitGatherYieldLabel('bonker')).toBeNull();
  });

  it('shares a tip only when every selected unit matches yield', () => {
    expect(sharedUnitGatherYieldLabel(['scavenger', 'scavenger'])).toBe(
      unitGatherYieldLabel('scavenger'),
    );
    expect(sharedUnitGatherYieldLabel(['scavenger', 'bonker'])).toBeNull();
    expect(sharedUnitGatherYieldLabel([])).toBeNull();
  });
});
