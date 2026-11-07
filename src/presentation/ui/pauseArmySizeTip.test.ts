import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pausePopulationTipLine } from './pausePopulationTip';

describe('pauseArmySizeTipLine', () => {
  it('labels Army · n with middot, distinct from Pop tip and minimap tip key', () => {
    expect(pauseArmySizeTipLine(7)).toBe(t('pause.armyTip', { n: 7 }));
    expect(pauseArmySizeTipLine(7)).toBe('Army · 7');
    expect(pauseArmySizeTipLine(7)).toMatch(/^Army \u00b7 /);
    expect(pauseArmySizeTipLine(0)).toBe(t('pause.armyTip', { n: 0 }));
    expect(pauseArmySizeTipLine(0)).toBe('Army · 0');
    expect(pauseArmySizeTipLine(0)).toMatch(/^Army \u00b7 /);
    expect(pauseArmySizeTipLine(7)).not.toBe(pausePopulationTipLine(7));
    // Same en copy as minimap army tip; distinct i18n key / surface.
    expect(pauseArmySizeTipLine(7)).toBe(minimapArmyCountTipText(7));
    expect(minimapArmyCountTipText(7)).toBe(t('hud.minimapArmy', { n: 7 }));
    expect(t('pause.armyTip', { n: 1 })).toBe(t('hud.minimapArmy', { n: 1 }));
  });

  it('localizes Army middot for pt-BR and es; keys stay pause-scoped', () => {
    setLocale('pt-BR');
    expect(pauseArmySizeTipLine(7)).toBe(t('pause.armyTip', { n: 7 }));
    expect(pauseArmySizeTipLine(7)).toBe('Tropa · 7');
    expect(pauseArmySizeTipLine(7)).toMatch(/^Tropa \u00b7 /);
    expect(pauseArmySizeTipLine(7)).toBe(minimapArmyCountTipText(7));
    expect(minimapArmyCountTipText(7)).toBe(t('hud.minimapArmy', { n: 7 }));

    setLocale('es');
    expect(pauseArmySizeTipLine(7)).toBe(t('pause.armyTip', { n: 7 }));
    expect(pauseArmySizeTipLine(7)).toBe('Tropa · 7');
    expect(pauseArmySizeTipLine(7)).toMatch(/^Tropa \u00b7 /);
    expect(pauseArmySizeTipLine(7)).toBe(minimapArmyCountTipText(7));
    expect(minimapArmyCountTipText(7)).toBe(t('hud.minimapArmy', { n: 7 }));
    setLocale('en-GB');
  });
});
