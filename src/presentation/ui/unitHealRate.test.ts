import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { unitDpsLabel } from './unitDps';
import {
  sharedUnitHealRateLabel,
  unitHealRate,
  unitHealRateLabel,
} from './unitHealRate';

describe('unitHealRate', () => {
  it('labels Boniface Emergency Repairs as Heal · n/s', () => {
    // 180 HP / 14s ≈ 13 HP/s
    expect(unitHealRate('boniface')).toBe(13);
    expect(unitHealRateLabel('boniface')).toBe(t('sel.healRateTip', { n: 13 }));
    expect(unitHealRateLabel('boniface')).toMatch(/^Heal ·/);
    expect(unitHealRateLabel('boniface')).toMatch(/\/s$/);
    expect(unitHealRateLabel('boniface')).not.toBe(unitDpsLabel('boniface'));
    expect(unitHealRate('gruk')).toBeNull();
    expect(unitHealRateLabel('scavenger')).toBeNull();
  });

  it('shares the tip only when every selected unit matches', () => {
    expect(sharedUnitHealRateLabel(['boniface', 'boniface'])).toBe(
      unitHealRateLabel('boniface'),
    );
    expect(sharedUnitHealRateLabel(['boniface', 'gruk'])).toBeNull();
    expect(sharedUnitHealRateLabel([])).toBeNull();
  });
});
