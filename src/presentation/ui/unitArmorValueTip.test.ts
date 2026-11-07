import { describe, expect, it } from 'vitest';
import { unitArmorValue } from '../../data/unitArmorValue';
import { t } from '../../i18n';
import {
  sharedUnitArmorValueLabel,
  unitArmorValueLabel,
} from './unitArmorValueTip';
import { unitArmorClassTipLabel } from './unitArmorClassTip';

describe('unitArmorValueLabel', () => {
  it('labels Armor · n from catalog', () => {
    const n = unitArmorValue('bonker');
    expect(unitArmorValueLabel('bonker')).toBe(t('sel.armorValueTip', { n }));
    expect(unitArmorValueLabel('bonker')).toMatch(/^Armor ·/);
    expect(unitArmorValueLabel('bonker')).not.toBe(
      unitArmorClassTipLabel('bonker'),
    );
  });

  it('shares a tip only when every selected unit has the same armor', () => {
    expect(sharedUnitArmorValueLabel(['bonker', 'tin_knight'])).toBe(
      unitArmorValueLabel('bonker'),
    );
    expect(sharedUnitArmorValueLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitArmorValueLabel([])).toBeNull();
  });
});
