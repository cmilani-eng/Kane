import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseBuildingCountTipLine } from './pauseBuildingCountTip';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseBuildingCountTipLine', () => {
  it('labels Buildings · n with middot, distinct from Army · / Pop · / Selected ·', () => {
    expect(pauseBuildingCountTipLine(4)).toBe(
      t('pause.buildingsTip', { n: 4 }),
    );
    expect(pauseBuildingCountTipLine(4)).toBe('Buildings · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Buildings \u00b7 /);
    expect(pauseBuildingCountTipLine(4)).not.toMatch(/ {2}/);
    expect(pauseBuildingCountTipLine(0)).toBe(
      t('pause.buildingsTip', { n: 0 }),
    );
    expect(pauseBuildingCountTipLine(0)).toBe('Buildings · 0');
    expect(pauseBuildingCountTipLine(0)).toMatch(/^Buildings \u00b7 /);

    const buildings = pauseBuildingCountTipLine(4);
    expect(buildings).not.toBe(pauseArmySizeTipLine(4));
    expect(pauseArmySizeTipLine(4)).toBe('Army · 4');
    expect(pauseArmySizeTipLine(4)).toMatch(/^Army \u00b7 /);
    expect(buildings).not.toBe(pausePopulationTipLine(4));
    expect(pausePopulationTipLine(4)).toBe('Pop · 4');
    expect(pausePopulationTipLine(4)).toMatch(/^Pop \u00b7 /);
    expect(buildings).not.toBe(pauseSelectionCountTipLine(4));
    expect(pauseSelectionCountTipLine(4)).toBe('Selected · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Selected \u00b7 /);
    expect(buildings).not.toMatch(/^Army \u00b7 /);
    expect(buildings).not.toMatch(/^Pop \u00b7 /);
    expect(buildings).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as minimap buildings tip; distinct i18n key / surface.
    expect(buildings).toBe(minimapBuildingCountTipText(4));
    expect(minimapBuildingCountTipText(4)).toBe(
      t('hud.minimapBuildings', { n: 4 }),
    );
    expect(minimapBuildingCountTipText(4)).toBe('Buildings · 4');
    expect(minimapBuildingCountTipText(4)).toMatch(/^Buildings \u00b7 /);
    expect(t('pause.buildingsTip', { n: 1 })).toBe(
      t('hud.minimapBuildings', { n: 1 }),
    );
  });

  it('localizes Buildings middot for pt-BR and es; stays distinct from Army / Pop / Selected', () => {
    setLocale('pt-BR');
    expect(pauseBuildingCountTipLine(4)).toBe(
      t('pause.buildingsTip', { n: 4 }),
    );
    expect(pauseBuildingCountTipLine(4)).toBe('Prédios · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Prédios \u00b7 /);
    expect(pauseBuildingCountTipLine(4)).not.toMatch(/ {2}/);

    const buildingsPt = pauseBuildingCountTipLine(4);
    expect(buildingsPt).not.toBe(pauseArmySizeTipLine(4));
    expect(pauseArmySizeTipLine(4)).toBe('Tropa · 4');
    expect(pauseArmySizeTipLine(4)).toMatch(/^Tropa \u00b7 /);
    expect(buildingsPt).not.toBe(pausePopulationTipLine(4));
    expect(pausePopulationTipLine(4)).toBe('Pop · 4');
    expect(pausePopulationTipLine(4)).toMatch(/^Pop \u00b7 /);
    expect(buildingsPt).not.toBe(pauseSelectionCountTipLine(4));
    expect(pauseSelectionCountTipLine(4)).toBe('Selecionados · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Selecionados \u00b7 /);
    expect(buildingsPt).not.toMatch(/^Tropa \u00b7 /);
    expect(buildingsPt).not.toMatch(/^Pop \u00b7 /);
    expect(buildingsPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(buildingsPt).toBe(minimapBuildingCountTipText(4));
    expect(minimapBuildingCountTipText(4)).toBe(
      t('hud.minimapBuildings', { n: 4 }),
    );

    setLocale('es');
    expect(pauseBuildingCountTipLine(4)).toBe(
      t('pause.buildingsTip', { n: 4 }),
    );
    expect(pauseBuildingCountTipLine(4)).toBe('Edificios · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Edificios \u00b7 /);
    expect(pauseBuildingCountTipLine(4)).not.toMatch(/ {2}/);

    const buildingsEs = pauseBuildingCountTipLine(4);
    expect(buildingsEs).not.toBe(pauseArmySizeTipLine(4));
    expect(pauseArmySizeTipLine(4)).toBe('Tropa · 4');
    expect(pauseArmySizeTipLine(4)).toMatch(/^Tropa \u00b7 /);
    expect(buildingsEs).not.toBe(pausePopulationTipLine(4));
    expect(pausePopulationTipLine(4)).toBe('Pop · 4');
    expect(pausePopulationTipLine(4)).toMatch(/^Pop \u00b7 /);
    expect(buildingsEs).not.toBe(pauseSelectionCountTipLine(4));
    expect(pauseSelectionCountTipLine(4)).toBe('Seleccionados · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Seleccionados \u00b7 /);
    expect(buildingsEs).not.toMatch(/^Tropa \u00b7 /);
    expect(buildingsEs).not.toMatch(/^Pop \u00b7 /);
    expect(buildingsEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(buildingsEs).toBe(minimapBuildingCountTipText(4));
    expect(minimapBuildingCountTipText(4)).toBe(
      t('hud.minimapBuildings', { n: 4 }),
    );
    setLocale('en-GB');
  });
});
