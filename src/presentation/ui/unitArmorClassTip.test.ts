import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  sharedUnitArmorClassTipLabel,
  unitArmorClassTipLabel,
} from './unitArmorClassTip';

describe('unitArmorClassTip', () => {
  it('labels GDD armor class with the Armor tip', () => {
    expect(unitArmorClassTipLabel('tin_knight')).toBe(
      t('sel.armorTip', { role: t('sel.armor.infantry') }),
    );
    expect(unitArmorClassTipLabel('boom_cart')).toContain(
      t('sel.armor.siege'),
    );
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
