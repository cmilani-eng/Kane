import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { minimapVisionTipText } from './minimapVisionTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';

describe('minimapArmyCountTipText', () => {
  it('labels Army · n with middot, distinct from Selected · / Vision · / Fog ·', () => {
    expect(minimapArmyCountTipText(5)).toBe(t('hud.minimapArmy', { n: 5 }));
    expect(minimapArmyCountTipText(5)).toBe('Army · 5');
    expect(minimapArmyCountTipText(5)).toMatch(/^Army \u00b7 /);
    expect(minimapArmyCountTipText(0)).toBe(t('hud.minimapArmy', { n: 0 }));
    expect(minimapArmyCountTipText(0)).toBe('Army · 0');
    expect(minimapArmyCountTipText(0)).toMatch(/^Army \u00b7 /);

    const army = minimapArmyCountTipText(5);
    expect(army).not.toBe(minimapSelectedCountTipText(5));
    expect(army).not.toBe(minimapVisionTipText(5));
    expect(army).not.toBe(minimapFogCoverageTipText(5));
    expect(army).not.toMatch(/^Selected \u00b7 /);
    expect(army).not.toMatch(/^Vision \u00b7 /);
    expect(army).not.toMatch(/^Fog \u00b7 /);
    expect(army).not.toBe(t('hud.armyCount', { n: 5 }));

    // Same en copy as pause tip; distinct i18n key / surface.
    expect(army).toBe(pauseArmySizeTipLine(5));
    expect(pauseArmySizeTipLine(5)).toBe(t('pause.armyTip', { n: 5 }));
    expect(pauseArmySizeTipLine(5)).toBe('Army · 5');
    expect(pauseArmySizeTipLine(5)).toMatch(/^Army \u00b7 /);
    expect(t('hud.minimapArmy', { n: 1 })).toBe(t('pause.armyTip', { n: 1 }));
  });

  it('localizes Army middot for pt-BR and es; stays distinct from Selected / Vision / Fog', () => {
    setLocale('pt-BR');
    expect(minimapArmyCountTipText(5)).toBe(t('hud.minimapArmy', { n: 5 }));
    expect(minimapArmyCountTipText(5)).toBe('Tropa · 5');
    expect(minimapArmyCountTipText(5)).toMatch(/^Tropa \u00b7 /);

    const armyPt = minimapArmyCountTipText(5);
    expect(armyPt).not.toBe(minimapSelectedCountTipText(5));
    expect(armyPt).not.toBe(minimapVisionTipText(5));
    expect(armyPt).not.toBe(minimapFogCoverageTipText(5));
    expect(armyPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(armyPt).not.toMatch(/^Visão \u00b7 /);
    expect(armyPt).not.toMatch(/^Névoa \u00b7 /);
    expect(armyPt).toBe(pauseArmySizeTipLine(5));
    expect(pauseArmySizeTipLine(5)).toBe(t('pause.armyTip', { n: 5 }));

    setLocale('es');
    expect(minimapArmyCountTipText(5)).toBe(t('hud.minimapArmy', { n: 5 }));
    expect(minimapArmyCountTipText(5)).toBe('Tropa · 5');
    expect(minimapArmyCountTipText(5)).toMatch(/^Tropa \u00b7 /);

    const armyEs = minimapArmyCountTipText(5);
    expect(armyEs).not.toBe(minimapSelectedCountTipText(5));
    expect(armyEs).not.toBe(minimapVisionTipText(5));
    expect(armyEs).not.toBe(minimapFogCoverageTipText(5));
    expect(armyEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(armyEs).not.toMatch(/^Visión \u00b7 /);
    expect(armyEs).not.toMatch(/^Niebla \u00b7 /);
    expect(armyEs).toBe(pauseArmySizeTipLine(5));
    expect(pauseArmySizeTipLine(5)).toBe(t('pause.armyTip', { n: 5 }));
    setLocale('en-GB');
  });
});
