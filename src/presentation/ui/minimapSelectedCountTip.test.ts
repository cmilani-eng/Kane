import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';
import { minimapEnemyCountTipText } from './minimapEnemyCountTip';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

describe('minimapSelectedCountTipText', () => {
  it('labels Selected · n with middot, distinct from Army · / Pop · / Enemies · / Buildings ·', () => {
    expect(minimapSelectedCountTipText(3)).toBe(
      t('hud.minimapSelected', { n: 3 }),
    );
    expect(minimapSelectedCountTipText(3)).toBe('Selected · 3');
    expect(minimapSelectedCountTipText(3)).toMatch(/^Selected \u00b7 /);
    expect(minimapSelectedCountTipText(0)).toBe(
      t('hud.minimapSelected', { n: 0 }),
    );
    expect(minimapSelectedCountTipText(0)).toBe('Selected · 0');
    expect(minimapSelectedCountTipText(0)).toMatch(/^Selected \u00b7 /);

    const selected = minimapSelectedCountTipText(3);
    expect(selected).not.toBe(minimapArmyCountTipText(3));
    expect(minimapArmyCountTipText(3)).toBe('Army · 3');
    expect(minimapArmyCountTipText(3)).toMatch(/^Army \u00b7 /);
    expect(selected).not.toBe(minimapPopulationTipText(3));
    expect(minimapPopulationTipText(3)).toBe('Pop · 3');
    expect(minimapPopulationTipText(3)).toMatch(/^Pop \u00b7 /);
    expect(selected).not.toBe(minimapEnemyCountTipText(3));
    expect(minimapEnemyCountTipText(3)).toBe('Enemies · 3');
    expect(minimapEnemyCountTipText(3)).toMatch(/^Enemies \u00b7 /);
    expect(selected).not.toBe(minimapBuildingCountTipText(3));
    expect(minimapBuildingCountTipText(3)).toBe('Buildings · 3');
    expect(minimapBuildingCountTipText(3)).toMatch(/^Buildings \u00b7 /);
    expect(selected).not.toMatch(/^Army \u00b7 /);
    expect(selected).not.toMatch(/^Pop \u00b7 /);
    expect(selected).not.toMatch(/^Enemies \u00b7 /);
    expect(selected).not.toMatch(/^Buildings \u00b7 /);

    // Same en copy as pause tip; distinct i18n key / surface.
    expect(selected).toBe(pauseSelectionCountTipLine(3));
    expect(pauseSelectionCountTipLine(3)).toBe(
      t('pause.selectionCountTip', { n: 3 }),
    );
    expect(pauseSelectionCountTipLine(3)).toBe('Selected · 3');
    expect(pauseSelectionCountTipLine(3)).toMatch(/^Selected \u00b7 /);
    expect(t('hud.minimapSelected', { n: 1 })).toBe(
      t('pause.selectionCountTip', { n: 1 }),
    );
    expect(t('hud.minimapSelected', { n: 1 })).not.toBe(
      t('pause.selectedSectorTip', { sector: 'NW' }),
    );
  });

  it('localizes Selected middot for pt-BR and es; stays distinct from Army / Pop / Enemies / Buildings', () => {
    setLocale('pt-BR');
    expect(minimapSelectedCountTipText(3)).toBe(
      t('hud.minimapSelected', { n: 3 }),
    );
    expect(minimapSelectedCountTipText(3)).toBe('Selecionados · 3');
    expect(minimapSelectedCountTipText(3)).toMatch(/^Selecionados \u00b7 /);

    const selectedPt = minimapSelectedCountTipText(3);
    expect(selectedPt).not.toBe(minimapArmyCountTipText(3));
    expect(minimapArmyCountTipText(3)).toBe('Tropa · 3');
    expect(minimapArmyCountTipText(3)).toMatch(/^Tropa \u00b7 /);
    expect(selectedPt).not.toBe(minimapPopulationTipText(3));
    expect(minimapPopulationTipText(3)).toBe('Pop · 3');
    expect(minimapPopulationTipText(3)).toMatch(/^Pop \u00b7 /);
    expect(selectedPt).not.toBe(minimapEnemyCountTipText(3));
    expect(minimapEnemyCountTipText(3)).toBe('Inimigos · 3');
    expect(minimapEnemyCountTipText(3)).toMatch(/^Inimigos \u00b7 /);
    expect(selectedPt).not.toBe(minimapBuildingCountTipText(3));
    expect(minimapBuildingCountTipText(3)).toBe('Prédios · 3');
    expect(minimapBuildingCountTipText(3)).toMatch(/^Prédios \u00b7 /);
    expect(selectedPt).not.toMatch(/^Tropa \u00b7 /);
    expect(selectedPt).not.toMatch(/^Pop \u00b7 /);
    expect(selectedPt).not.toMatch(/^Inimigos \u00b7 /);
    expect(selectedPt).not.toMatch(/^Prédios \u00b7 /);
    expect(selectedPt).toBe(pauseSelectionCountTipLine(3));
    expect(pauseSelectionCountTipLine(3)).toBe(
      t('pause.selectionCountTip', { n: 3 }),
    );

    setLocale('es');
    expect(minimapSelectedCountTipText(3)).toBe(
      t('hud.minimapSelected', { n: 3 }),
    );
    expect(minimapSelectedCountTipText(3)).toBe('Seleccionados · 3');
    expect(minimapSelectedCountTipText(3)).toMatch(/^Seleccionados \u00b7 /);

    const selectedEs = minimapSelectedCountTipText(3);
    expect(selectedEs).not.toBe(minimapArmyCountTipText(3));
    expect(minimapArmyCountTipText(3)).toBe('Tropa · 3');
    expect(minimapArmyCountTipText(3)).toMatch(/^Tropa \u00b7 /);
    expect(selectedEs).not.toBe(minimapPopulationTipText(3));
    expect(minimapPopulationTipText(3)).toBe('Pop · 3');
    expect(minimapPopulationTipText(3)).toMatch(/^Pop \u00b7 /);
    expect(selectedEs).not.toBe(minimapEnemyCountTipText(3));
    expect(minimapEnemyCountTipText(3)).toBe('Enemigos · 3');
    expect(minimapEnemyCountTipText(3)).toMatch(/^Enemigos \u00b7 /);
    expect(selectedEs).not.toBe(minimapBuildingCountTipText(3));
    expect(minimapBuildingCountTipText(3)).toBe('Edificios · 3');
    expect(minimapBuildingCountTipText(3)).toMatch(/^Edificios \u00b7 /);
    expect(selectedEs).not.toMatch(/^Tropa \u00b7 /);
    expect(selectedEs).not.toMatch(/^Pop \u00b7 /);
    expect(selectedEs).not.toMatch(/^Enemigos \u00b7 /);
    expect(selectedEs).not.toMatch(/^Edificios \u00b7 /);
    expect(selectedEs).toBe(pauseSelectionCountTipLine(3));
    expect(pauseSelectionCountTipLine(3)).toBe(
      t('pause.selectionCountTip', { n: 3 }),
    );
    setLocale('en-GB');
  });
});
