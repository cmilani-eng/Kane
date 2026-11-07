import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';
import { minimapEnemyCountTipText } from './minimapEnemyCountTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { pauseBuildingCountTipLine } from './pauseBuildingCountTip';

describe('minimapBuildingCountTipText', () => {
  it('labels Buildings · n with middot, distinct from Army · / Enemies · / Selected ·', () => {
    expect(minimapBuildingCountTipText(3)).toBe(
      t('hud.minimapBuildings', { n: 3 }),
    );
    expect(minimapBuildingCountTipText(3)).toBe('Buildings · 3');
    expect(minimapBuildingCountTipText(3)).toMatch(/^Buildings \u00b7 /);
    expect(minimapBuildingCountTipText(0)).toBe(
      t('hud.minimapBuildings', { n: 0 }),
    );
    expect(minimapBuildingCountTipText(0)).toBe('Buildings · 0');
    expect(minimapBuildingCountTipText(0)).toMatch(/^Buildings \u00b7 /);

    const buildings = minimapBuildingCountTipText(3);
    expect(buildings).not.toBe(minimapArmyCountTipText(3));
    expect(buildings).not.toBe(minimapEnemyCountTipText(3));
    expect(buildings).not.toBe(minimapSelectedCountTipText(3));
    expect(buildings).not.toMatch(/^Army \u00b7 /);
    expect(buildings).not.toMatch(/^Enemies \u00b7 /);
    expect(buildings).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as pause Buildings tip; distinct i18n key / surface.
    expect(buildings).toBe(pauseBuildingCountTipLine(3));
    expect(pauseBuildingCountTipLine(3)).toBe(t('pause.buildingsTip', { n: 3 }));
    expect(pauseBuildingCountTipLine(3)).toBe('Buildings · 3');
    expect(pauseBuildingCountTipLine(3)).toMatch(/^Buildings \u00b7 /);
    expect(t('hud.minimapBuildings', { n: 1 })).toBe(
      t('pause.buildingsTip', { n: 1 }),
    );
  });

  it('localizes Buildings middot for pt-BR and es; stays distinct from Army / Enemies / Selected', () => {
    setLocale('pt-BR');
    expect(minimapBuildingCountTipText(3)).toBe(
      t('hud.minimapBuildings', { n: 3 }),
    );
    expect(minimapBuildingCountTipText(3)).toBe('Prédios · 3');
    expect(minimapBuildingCountTipText(3)).toMatch(/^Prédios \u00b7 /);

    const buildingsPt = minimapBuildingCountTipText(3);
    expect(buildingsPt).not.toBe(minimapArmyCountTipText(3));
    expect(buildingsPt).not.toBe(minimapEnemyCountTipText(3));
    expect(buildingsPt).not.toBe(minimapSelectedCountTipText(3));
    expect(buildingsPt).not.toMatch(/^Tropa \u00b7 /);
    expect(buildingsPt).not.toMatch(/^Inimigos \u00b7 /);
    expect(buildingsPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(buildingsPt).toBe(pauseBuildingCountTipLine(3));
    expect(pauseBuildingCountTipLine(3)).toBe(t('pause.buildingsTip', { n: 3 }));

    setLocale('es');
    expect(minimapBuildingCountTipText(3)).toBe(
      t('hud.minimapBuildings', { n: 3 }),
    );
    expect(minimapBuildingCountTipText(3)).toBe('Edificios · 3');
    expect(minimapBuildingCountTipText(3)).toMatch(/^Edificios \u00b7 /);

    const buildingsEs = minimapBuildingCountTipText(3);
    expect(buildingsEs).not.toBe(minimapArmyCountTipText(3));
    expect(buildingsEs).not.toBe(minimapEnemyCountTipText(3));
    expect(buildingsEs).not.toBe(minimapSelectedCountTipText(3));
    expect(buildingsEs).not.toMatch(/^Tropa \u00b7 /);
    expect(buildingsEs).not.toMatch(/^Enemigos \u00b7 /);
    expect(buildingsEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(buildingsEs).toBe(pauseBuildingCountTipLine(3));
    expect(pauseBuildingCountTipLine(3)).toBe(t('pause.buildingsTip', { n: 3 }));
    setLocale('en-GB');
  });
});
