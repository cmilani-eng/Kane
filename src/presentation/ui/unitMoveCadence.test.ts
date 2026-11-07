import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  moveCadenceBucket,
  sharedUnitMoveCadenceLabel,
  unitMoveCadence,
  unitMoveCadenceLabel,
} from './unitMoveCadence';

describe('unitMoveCadence', () => {
  it('buckets tiles/s into Slow / Medium / Fast', () => {
    expect(moveCadenceBucket(1.5)).toBe('slow');
    expect(moveCadenceBucket(2.4)).toBe('medium');
    expect(moveCadenceBucket(3.2)).toBe('fast');
    expect(moveCadenceBucket(null)).toBeNull();
  });

  it('labels catalog units with the pace tip', () => {
    expect(unitMoveCadence('stomper')).toBe('slow');
    expect(unitMoveCadence('wolf_rider')).toBe('fast');
    expect(unitMoveCadenceLabel('stomper')).toBe(
      t('sel.moveCadenceTip', { pace: t('sel.moveCadence.slow') }),
    );
  });

  it('shares a tip only when every selected unit matches pace', () => {
    expect(sharedUnitMoveCadenceLabel(['stomper', 'boom_cart'])).toBe(
      unitMoveCadenceLabel('stomper'),
    );
    expect(sharedUnitMoveCadenceLabel(['stomper', 'wolf_rider'])).toBeNull();
    expect(sharedUnitMoveCadenceLabel([])).toBeNull();
  });
});
