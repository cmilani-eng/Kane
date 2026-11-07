import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { buildingArmorClassLabel } from './buildingArmorClass';
import {
  sharedUnitArmorClassTipLabel,
  unitArmorClassTipLabel,
} from './unitArmorClassTip';
import { unitArmorValueLabel } from './unitArmorValueTip';

describe('unitArmorClassTip', () => {
  it('labels Armor · type with middot, distinct from Armor · n / Structure', () => {
    expect(unitArmorClassTipLabel('tin_knight')).toBe(
      t('sel.armorTip', { role: t('sel.armor.infantry') }),
    );
    expect(unitArmorClassTipLabel('tin_knight')).toBe('Armor · Infantry');
    expect(unitArmorClassTipLabel('tin_knight')).toMatch(/^Armor \u00b7 /);
    expect(unitArmorClassTipLabel('boom_cart')).toBe('Armor · Siege');
    expect(unitArmorClassTipLabel('tin_knight')).not.toBe(
      unitArmorValueLabel('tin_knight'),
    );
    expect(unitArmorClassTipLabel('tin_knight')).not.toMatch(/\d+$/);
    expect(unitArmorClassTipLabel('tin_knight')).not.toBe(
      buildingArmorClassLabel('junkyard'),
    );
    expect(unitArmorClassTipLabel('tin_knight')).not.toContain(
      t('sel.armor.structure'),
    );
  });

  it('localizes Armor · type middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(unitArmorClassTipLabel('tin_knight')).toBe(
      t('sel.armorTip', { role: t('sel.armor.infantry') }),
    );
    expect(unitArmorClassTipLabel('tin_knight')).toBe('Armadura · Infantaria');
    expect(unitArmorClassTipLabel('tin_knight')).toMatch(/^Armadura \u00b7 /);
    expect(unitArmorClassTipLabel('tin_knight')).not.toBe(
      unitArmorValueLabel('tin_knight'),
    );
    expect(unitArmorClassTipLabel('tin_knight')).not.toBe(
      buildingArmorClassLabel('junkyard'),
    );

    setLocale('es');
    expect(unitArmorClassTipLabel('boom_cart')).toBe(
      t('sel.armorTip', { role: t('sel.armor.siege') }),
    );
    expect(unitArmorClassTipLabel('boom_cart')).toBe('Armadura · Asedio');
    expect(unitArmorClassTipLabel('boom_cart')).toMatch(/^Armadura \u00b7 /);
    expect(unitArmorClassTipLabel('boom_cart')).not.toBe(
      unitArmorValueLabel('boom_cart'),
    );
    expect(unitArmorClassTipLabel('boom_cart')).not.toBe(
      buildingArmorClassLabel('junkyard'),
    );
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit shares one class', () => {
    expect(sharedUnitArmorClassTipLabel(['tin_knight', 'bonker'])).toBe(
      unitArmorClassTipLabel('tin_knight'),
    );
    expect(
      sharedUnitArmorClassTipLabel(['tin_knight', 'bolt_boy']),
    ).toBeNull();
    expect(sharedUnitArmorClassTipLabel([])).toBeNull();
  });
});
