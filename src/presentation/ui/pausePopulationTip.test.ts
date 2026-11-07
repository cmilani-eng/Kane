import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pausePopulationTipLine', () => {
  it('labels Pop · n with middot, distinct from Supply · / Army · / Selected ·', () => {
    expect(pausePopulationTipLine(12)).toBe(t('pause.populationTip', { n: 12 }));
    expect(pausePopulationTipLine(12)).toBe('Pop · 12');
    expect(pausePopulationTipLine(12)).toMatch(/^Pop \u00b7 /);
    expect(pausePopulationTipLine(0)).toBe(t('pause.populationTip', { n: 0 }));
    expect(pausePopulationTipLine(0)).toBe('Pop · 0');
    expect(pausePopulationTipLine(0)).toMatch(/^Pop \u00b7 /);

    const pop = pausePopulationTipLine(12);
    expect(pop).not.toBe(pauseSupplyRatioTipLine(12, 36));
    expect(pop).not.toBe(pauseArmySizeTipLine(12));
    expect(pop).not.toBe(pauseSelectionCountTipLine(12));
    expect(pop).not.toMatch(/^Supply \u00b7 /);
    expect(pop).not.toMatch(/^Army \u00b7 /);
    expect(pop).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(pop).toBe(minimapPopulationTipText(12));
    expect(minimapPopulationTipText(12)).toBe(t('hud.minimapPop', { n: 12 }));
    expect(minimapPopulationTipText(12)).toBe('Pop · 12');
    expect(minimapPopulationTipText(12)).toMatch(/^Pop \u00b7 /);
    expect(t('pause.populationTip', { n: 1 })).toBe(t('hud.minimapPop', { n: 1 }));
  });

  it('localizes Pop middot for pt-BR and es; stays distinct from Supply / Army / Selected', () => {
    setLocale('pt-BR');
    expect(pausePopulationTipLine(12)).toBe(t('pause.populationTip', { n: 12 }));
    expect(pausePopulationTipLine(12)).toBe('Pop · 12');
    expect(pausePopulationTipLine(12)).toMatch(/^Pop \u00b7 /);

    const popPt = pausePopulationTipLine(12);
    expect(popPt).not.toBe(pauseSupplyRatioTipLine(12, 36));
    expect(popPt).not.toBe(pauseArmySizeTipLine(12));
    expect(popPt).not.toBe(pauseSelectionCountTipLine(12));
    expect(popPt).not.toMatch(/^Suprimento \u00b7 /);
    expect(popPt).not.toMatch(/^Tropa \u00b7 /);
    expect(popPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(popPt).toBe(minimapPopulationTipText(12));
    expect(minimapPopulationTipText(12)).toBe(t('hud.minimapPop', { n: 12 }));

    setLocale('es');
    expect(pausePopulationTipLine(12)).toBe(t('pause.populationTip', { n: 12 }));
    expect(pausePopulationTipLine(12)).toBe('Pop · 12');
    expect(pausePopulationTipLine(12)).toMatch(/^Pop \u00b7 /);

    const popEs = pausePopulationTipLine(12);
    expect(popEs).not.toBe(pauseSupplyRatioTipLine(12, 36));
    expect(popEs).not.toBe(pauseArmySizeTipLine(12));
    expect(popEs).not.toBe(pauseSelectionCountTipLine(12));
    expect(popEs).not.toMatch(/^Suministro \u00b7 /);
    expect(popEs).not.toMatch(/^Tropa \u00b7 /);
    expect(popEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(popEs).toBe(minimapPopulationTipText(12));
    expect(minimapPopulationTipText(12)).toBe(t('hud.minimapPop', { n: 12 }));
    setLocale('en-GB');
  });
});
