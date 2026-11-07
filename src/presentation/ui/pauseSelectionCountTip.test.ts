import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseBuildingCountTipLine } from './pauseBuildingCountTip';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseSelectionCountTipLine', () => {
  it('labels Selected · n with middot, distinct from Army · / Pop · / Buildings ·', () => {
    expect(pauseSelectionCountTipLine(4)).toBe(
      t('pause.selectionCountTip', { n: 4 }),
    );
    expect(pauseSelectionCountTipLine(4)).toBe('Selected · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Selected \u00b7 /);
    expect(pauseSelectionCountTipLine(4)).not.toMatch(/  /);
    expect(pauseSelectionCountTipLine(0)).toBe(
      t('pause.selectionCountTip', { n: 0 }),
    );
    expect(pauseSelectionCountTipLine(0)).toBe('Selected · 0');
    expect(pauseSelectionCountTipLine(0)).toMatch(/^Selected \u00b7 /);

    const selected = pauseSelectionCountTipLine(4);
    expect(selected).not.toBe(pauseArmySizeTipLine(4));
    expect(pauseArmySizeTipLine(4)).toBe('Army · 4');
    expect(pauseArmySizeTipLine(4)).toMatch(/^Army \u00b7 /);
    expect(selected).not.toBe(pausePopulationTipLine(4));
    expect(pausePopulationTipLine(4)).toBe('Pop · 4');
    expect(pausePopulationTipLine(4)).toMatch(/^Pop \u00b7 /);
    expect(selected).not.toBe(pauseBuildingCountTipLine(4));
    expect(pauseBuildingCountTipLine(4)).toBe('Buildings · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Buildings \u00b7 /);
    expect(selected).not.toMatch(/^Army \u00b7 /);
    expect(selected).not.toMatch(/^Pop \u00b7 /);
    expect(selected).not.toMatch(/^Buildings \u00b7 /);

    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(selected).toBe(minimapSelectedCountTipText(4));
    expect(minimapSelectedCountTipText(4)).toBe(
      t('hud.minimapSelected', { n: 4 }),
    );
    expect(minimapSelectedCountTipText(4)).toBe('Selected · 4');
    expect(minimapSelectedCountTipText(4)).toMatch(/^Selected \u00b7 /);
    expect(t('pause.selectionCountTip', { n: 1 })).toBe(
      t('hud.minimapSelected', { n: 1 }),
    );
    expect(t('pause.selectionCountTip', { n: 1 })).not.toBe(
      t('pause.selectedSectorTip', { sector: 'NW' }),
    );
  });

  it('localizes Selected middot for pt-BR and es; stays distinct from Army / Pop / Buildings', () => {
    setLocale('pt-BR');
    expect(pauseSelectionCountTipLine(4)).toBe(
      t('pause.selectionCountTip', { n: 4 }),
    );
    expect(pauseSelectionCountTipLine(4)).toBe('Selecionados · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Selecionados \u00b7 /);
    expect(pauseSelectionCountTipLine(4)).not.toMatch(/  /);

    const selectedPt = pauseSelectionCountTipLine(4);
    expect(selectedPt).not.toBe(pauseArmySizeTipLine(4));
    expect(pauseArmySizeTipLine(4)).toBe('Tropa · 4');
    expect(pauseArmySizeTipLine(4)).toMatch(/^Tropa \u00b7 /);
    expect(selectedPt).not.toBe(pausePopulationTipLine(4));
    expect(pausePopulationTipLine(4)).toBe('Pop · 4');
    expect(pausePopulationTipLine(4)).toMatch(/^Pop \u00b7 /);
    expect(selectedPt).not.toBe(pauseBuildingCountTipLine(4));
    expect(pauseBuildingCountTipLine(4)).toBe('Prédios · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Prédios \u00b7 /);
    expect(selectedPt).not.toMatch(/^Tropa \u00b7 /);
    expect(selectedPt).not.toMatch(/^Pop \u00b7 /);
    expect(selectedPt).not.toMatch(/^Prédios \u00b7 /);
    expect(selectedPt).toBe(minimapSelectedCountTipText(4));
    expect(minimapSelectedCountTipText(4)).toBe(
      t('hud.minimapSelected', { n: 4 }),
    );

    setLocale('es');
    expect(pauseSelectionCountTipLine(4)).toBe(
      t('pause.selectionCountTip', { n: 4 }),
    );
    expect(pauseSelectionCountTipLine(4)).toBe('Seleccionados · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Seleccionados \u00b7 /);
    expect(pauseSelectionCountTipLine(4)).not.toMatch(/  /);

    const selectedEs = pauseSelectionCountTipLine(4);
    expect(selectedEs).not.toBe(pauseArmySizeTipLine(4));
    expect(pauseArmySizeTipLine(4)).toBe('Tropa · 4');
    expect(pauseArmySizeTipLine(4)).toMatch(/^Tropa \u00b7 /);
    expect(selectedEs).not.toBe(pausePopulationTipLine(4));
    expect(pausePopulationTipLine(4)).toBe('Pop · 4');
    expect(pausePopulationTipLine(4)).toMatch(/^Pop \u00b7 /);
    expect(selectedEs).not.toBe(pauseBuildingCountTipLine(4));
    expect(pauseBuildingCountTipLine(4)).toBe('Edificios · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Edificios \u00b7 /);
    expect(selectedEs).not.toMatch(/^Tropa \u00b7 /);
    expect(selectedEs).not.toMatch(/^Pop \u00b7 /);
    expect(selectedEs).not.toMatch(/^Edificios \u00b7 /);
    expect(selectedEs).toBe(minimapSelectedCountTipText(4));
    expect(minimapSelectedCountTipText(4)).toBe(
      t('hud.minimapSelected', { n: 4 }),
    );
    setLocale('en-GB');
  });
});
