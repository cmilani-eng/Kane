import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { buildingArmorClassLabel } from './buildingArmorClass';

describe('buildingArmorClassLabel', () => {
  it('formats Armor · Structure for a building', () => {
    expect(buildingArmorClassLabel('junkyard')).toBe(
      t('sel.armorClass', { role: t('sel.armor.structure') }),
    );
  });
});
