import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { buildingArmorClassLabel } from './buildingArmorClass';
import { unitArmorClassTipLabel } from './unitArmorClassTip';
import { unitArmorValueLabel } from './unitArmorValueTip';

describe('buildingArmorClassLabel', () => {
  it('formats Armor · Structure with middot, distinct from unit type / value tips', () => {
    expect(buildingArmorClassLabel('junkyard')).toBe(
      t('sel.armorTip', { role: t('sel.armor.structure') }),
    );
    expect(buildingArmorClassLabel('junkyard')).toBe('Armor · Structure');
    expect(buildingArmorClassLabel('junkyard')).toMatch(/^Armor \u00b7 /);
    expect(buildingArmorClassLabel('junkyard')).not.toBe(
      unitArmorClassTipLabel('tin_knight'),
    );
    expect(buildingArmorClassLabel('junkyard')).not.toBe(
      unitArmorValueLabel('tin_knight'),
    );
  });

  it('localizes Armor · Structure middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(buildingArmorClassLabel('royal_keep')).toBe(
      t('sel.armorTip', { role: t('sel.armor.structure') }),
    );
    expect(buildingArmorClassLabel('royal_keep')).toBe('Armadura · Estrutura');
    expect(buildingArmorClassLabel('royal_keep')).toMatch(/^Armadura \u00b7 /);

    setLocale('es');
    expect(buildingArmorClassLabel('weird_core')).toBe(
      t('sel.armorTip', { role: t('sel.armor.structure') }),
    );
    expect(buildingArmorClassLabel('weird_core')).toBe('Armadura · Estructura');
    expect(buildingArmorClassLabel('weird_core')).toMatch(/^Armadura \u00b7 /);
    setLocale('en-GB');
  });
});
