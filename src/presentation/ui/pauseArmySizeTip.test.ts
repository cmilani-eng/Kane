import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseBuildingCountTipLine } from './pauseBuildingCountTip';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseArmySizeTipLine', () => {
  it('labels Army · n with middot, distinct from Pop · / Selected · / Buildings ·', () => {
    expect(pauseArmySizeTipLine(7)).toBe(t('pause.armyTip', { n: 7 }));
    expect(pauseArmySizeTipLine(7)).toBe('Army · 7');
    expect(pauseArmySizeTipLine(7)).toMatch(/^Army \u00b7 /);
    expect(pauseArmySizeTipLine(7)).not.toMatch(/ {2}/);
    expect(pauseArmySizeTipLine(0)).toBe(t('pause.armyTip', { n: 0 }));
    expect(pauseArmySizeTipLine(0)).toBe('Army · 0');
    expect(pauseArmySizeTipLine(0)).toMatch(/^Army \u00b7 /);

    const army = pauseArmySizeTipLine(7);
    expect(army).not.toBe(pausePopulationTipLine(7));
    expect(pausePopulationTipLine(7)).toBe('Pop · 7');
    expect(pausePopulationTipLine(7)).toMatch(/^Pop \u00b7 /);
    expect(army).not.toBe(pauseSelectionCountTipLine(7));
    expect(pauseSelectionCountTipLine(7)).toBe('Selected · 7');
    expect(pauseSelectionCountTipLine(7)).toMatch(/^Selected \u00b7 /);
    expect(army).not.toBe(pauseBuildingCountTipLine(7));
    expect(pauseBuildingCountTipLine(7)).toBe('Buildings · 7');
    expect(pauseBuildingCountTipLine(7)).toMatch(/^Buildings \u00b7 /);
    expect(army).not.toMatch(/^Pop \u00b7 /);
    expect(army).not.toMatch(/^Selected \u00b7 /);
    expect(army).not.toMatch(/^Buildings \u00b7 /);

    // Same en copy as minimap army tip; distinct i18n key / surface.
    expect(army).toBe(minimapArmyCountTipText(7));
    expect(minimapArmyCountTipText(7)).toBe(t('hud.minimapArmy', { n: 7 }));
    expect(minimapArmyCountTipText(7)).toBe('Army · 7');
    expect(minimapArmyCountTipText(7)).toMatch(/^Army \u00b7 /);
    expect(t('pause.armyTip', { n: 1 })).toBe(t('hud.minimapArmy', { n: 1 }));
  });

  it('localizes Army middot for pt-BR and es; stays distinct from Pop / Selected / Buildings', () => {
    setLocale('pt-BR');
    expect(pauseArmySizeTipLine(7)).toBe(t('pause.armyTip', { n: 7 }));
    expect(pauseArmySizeTipLine(7)).toBe('Tropa · 7');
    expect(pauseArmySizeTipLine(7)).toMatch(/^Tropa \u00b7 /);
    expect(pauseArmySizeTipLine(7)).not.toMatch(/ {2}/);

    const armyPt = pauseArmySizeTipLine(7);
    expect(armyPt).not.toBe(pausePopulationTipLine(7));
    expect(pausePopulationTipLine(7)).toBe('Pop · 7');
    expect(pausePopulationTipLine(7)).toMatch(/^Pop \u00b7 /);
    expect(armyPt).not.toBe(pauseSelectionCountTipLine(7));
    expect(pauseSelectionCountTipLine(7)).toBe('Selecionados · 7');
    expect(pauseSelectionCountTipLine(7)).toMatch(/^Selecionados \u00b7 /);
    expect(armyPt).not.toBe(pauseBuildingCountTipLine(7));
    expect(pauseBuildingCountTipLine(7)).toBe('Prédios · 7');
    expect(pauseBuildingCountTipLine(7)).toMatch(/^Prédios \u00b7 /);
    expect(armyPt).not.toMatch(/^Pop \u00b7 /);
    expect(armyPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(armyPt).not.toMatch(/^Prédios \u00b7 /);
    expect(armyPt).toBe(minimapArmyCountTipText(7));
    expect(minimapArmyCountTipText(7)).toBe(t('hud.minimapArmy', { n: 7 }));

    setLocale('es');
    expect(pauseArmySizeTipLine(7)).toBe(t('pause.armyTip', { n: 7 }));
    expect(pauseArmySizeTipLine(7)).toBe('Tropa · 7');
    expect(pauseArmySizeTipLine(7)).toMatch(/^Tropa \u00b7 /);
    expect(pauseArmySizeTipLine(7)).not.toMatch(/ {2}/);

    const armyEs = pauseArmySizeTipLine(7);
    expect(armyEs).not.toBe(pausePopulationTipLine(7));
    expect(pausePopulationTipLine(7)).toBe('Pop · 7');
    expect(pausePopulationTipLine(7)).toMatch(/^Pop \u00b7 /);
    expect(armyEs).not.toBe(pauseSelectionCountTipLine(7));
    expect(pauseSelectionCountTipLine(7)).toBe('Seleccionados · 7');
    expect(pauseSelectionCountTipLine(7)).toMatch(/^Seleccionados \u00b7 /);
    expect(armyEs).not.toBe(pauseBuildingCountTipLine(7));
    expect(pauseBuildingCountTipLine(7)).toBe('Edificios · 7');
    expect(pauseBuildingCountTipLine(7)).toMatch(/^Edificios \u00b7 /);
    expect(armyEs).not.toMatch(/^Pop \u00b7 /);
    expect(armyEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(armyEs).not.toMatch(/^Edificios \u00b7 /);
    expect(armyEs).toBe(minimapArmyCountTipText(7));
    expect(minimapArmyCountTipText(7)).toBe(t('hud.minimapArmy', { n: 7 }));
    setLocale('en-GB');
  });
});
