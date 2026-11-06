import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { armorClassLabel } from './selectionPanel';
import { unitArmorClassTipLabel } from './unitArmorClassTip';

describe('selection armor class', () => {
  it('labels unit armor class with the dedicated tip key', () => {
    expect(armorClassLabel('tin_knight')).toBe(
      unitArmorClassTipLabel('tin_knight'),
    );
    expect(armorClassLabel('boom_cart')).toContain(t('sel.armor.siege'));
    expect(t('sel.armorTip', { role: t('sel.armor.ranged') })).toMatch(
      /Armor|Armadura/,
    );
    // Distinct from building Structure tip key usage
    expect(unitArmorClassTipLabel('tin_knight')).not.toContain(
      t('sel.armor.structure'),
    );
  });
});
