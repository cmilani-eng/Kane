import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  sharedUnitCargoCapacityLabel,
  unitCargoCapacity,
  unitCargoCapacityLabel,
} from './unitCargoCapacity';

describe('unitCargoCapacity', () => {
  it('labels worker max haul as Cargo · n', () => {
    expect(unitCargoCapacity('scavenger')).toBe(10);
    expect(unitCargoCapacityLabel('scavenger')).toBe(
      t('sel.cargoCapTip', { n: 10 }),
    );
    expect(unitCargoCapacity('bonker')).toBeNull();
    expect(unitCargoCapacityLabel('bonker')).toBeNull();
  });

  it('shares a tip only when every selected unit matches capacity', () => {
    expect(sharedUnitCargoCapacityLabel(['scavenger', 'scavenger'])).toBe(
      unitCargoCapacityLabel('scavenger'),
    );
    expect(sharedUnitCargoCapacityLabel(['scavenger', 'bonker'])).toBeNull();
    expect(sharedUnitCargoCapacityLabel([])).toBeNull();
  });
});
