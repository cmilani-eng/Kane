import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { armorClassLabel } from './selectionPanel';
import { unitArmorClassTipLabel } from './unitArmorClassTip';
import { unitArmorValueLabel } from './unitArmorValueTip';

describe('selection armor class', () => {
  it('labels unit armor class with the dedicated tip key', () => {
    expect(armorClassLabel('tin_knight')).toBe(
      unitArmorClassTipLabel('tin_knight'),
    );
    expect(armorClassLabel('tin_knight')).toBe('Armor · Infantry');
    expect(armorClassLabel('tin_knight')).toMatch(/^Armor \u00b7 /);
    expect(armorClassLabel('boom_cart')).toContain(t('sel.armor.siege'));
    expect(t('sel.armorTip', { role: t('sel.armor.ranged') })).toBe(
      'Armor · Ranged',
    );
    // Distinct from numeric Armor · n value tip
    expect(armorClassLabel('tin_knight')).not.toBe(
      unitArmorValueLabel('tin_knight'),
    );
    // Distinct from building Structure tip key usage
    expect(unitArmorClassTipLabel('tin_knight')).not.toContain(
      t('sel.armor.structure'),
    );
  });
});
