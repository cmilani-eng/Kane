import { describe, expect, it } from 'vitest';
import { unitArmorValue } from '../../data/unitArmorValue';
import { setLocale, t } from '../../i18n';
import { buildingArmorClassLabel } from './buildingArmorClass';
import { unitArmorClassTipLabel } from './unitArmorClassTip';
import {
  sharedUnitArmorValueLabel,
  unitArmorValueLabel,
} from './unitArmorValueTip';

describe('unitArmorValueLabel', () => {
  it('labels Armor · n with middot, distinct from Armor · type / Structure', () => {
    const n = unitArmorValue('bonker');
    const line = unitArmorValueLabel('bonker');
    expect(line).toBe(t('sel.armorValueTip', { n }));
    expect(line).toBe(`Armor · ${n}`);
    expect(line).toMatch(/^Armor \u00b7 /);
    expect(line).toMatch(/\d+$/);
    expect(line).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(line).not.toBe(buildingArmorClassLabel('royal_keep'));
    expect(line).not.toMatch(/^Armor \u00b7 [A-Za-z]/);
    expect(line).not.toContain(t('sel.armor.structure'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armor \u00b7 /);
    expect(buildingArmorClassLabel('royal_keep')).toMatch(/^Armor \u00b7 /);

    expect(sharedUnitArmorValueLabel(['bonker', 'tin_knight'])).toBe(
      unitArmorValueLabel('bonker'),
    );
    expect(sharedUnitArmorValueLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitArmorValueLabel([])).toBeNull();
  });

  it('localizes Armor middot for pt-BR and es; stays distinct from type / Structure', () => {
    const n = unitArmorValue('bonker');

    setLocale('pt-BR');
    const pt = unitArmorValueLabel('bonker');
    expect(pt).toBe(t('sel.armorValueTip', { n }));
    expect(pt).toBe(`Armadura · ${n}`);
    expect(pt).toMatch(/^Armadura \u00b7 /);
    expect(pt).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(pt).not.toBe(buildingArmorClassLabel('royal_keep'));
    expect(pt).not.toContain(t('sel.armor.structure'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armadura \u00b7 /);
    expect(buildingArmorClassLabel('royal_keep')).toMatch(/^Armadura \u00b7 /);

    setLocale('es');
    const es = unitArmorValueLabel('bonker');
    expect(es).toBe(t('sel.armorValueTip', { n }));
    expect(es).toBe(`Armadura · ${n}`);
    expect(es).toMatch(/^Armadura \u00b7 /);
    expect(es).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(es).not.toBe(buildingArmorClassLabel('royal_keep'));
    expect(es).not.toContain(t('sel.armor.structure'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armadura \u00b7 /);
    expect(buildingArmorClassLabel('royal_keep')).toMatch(/^Armadura \u00b7 /);
    setLocale('en-GB');
  });
});
