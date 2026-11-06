import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { armorClassLabel } from './selectionPanel';

describe('selection armor class', () => {
  it('labels armor class from the unit role map', () => {
    expect(armorClassLabel('tin_knight')).toContain('Infantry');
    expect(armorClassLabel('boom_cart')).toContain('Siege');
    expect(t('sel.armorClass', { role: t('sel.armor.ranged') })).toMatch(
      /Armor|Armadura/,
    );
  });
});
