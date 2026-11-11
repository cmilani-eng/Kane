import { beforeEach, describe, expect, it } from 'vitest';
import {
  createFogState,
  FOG_COLS,
  worldToFog,
} from '../../gameplay/battlefield/battlefieldFog';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';
import {
  countVisibleEnemies,
  minimapEnemyCountTipText,
} from './minimapEnemyCountTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { minimapVisionTipText } from './minimapVisionTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('minimapEnemyCountTipText', () => {
  it('labels Enemies · n with middot, distinct from Army · / Selected · / Vision · / Buildings ·', () => {
    const enemies = minimapEnemyCountTipText(5);
    expect(enemies).toBe(t('hud.minimapEnemies', { n: 5 }));
    expect(enemies).toBe('Enemies · 5');
    expect(enemies).toMatch(/^Enemies \u00b7 /);
    expect(enemies).toMatch(/^Enemies \u00b7 5$/);
    expect(enemies).toContain(' \u00b7 ');
    expect(enemies).not.toContain('  ·  ');

    const zero = minimapEnemyCountTipText(0);
    expect(zero).toBe(t('hud.minimapEnemies', { n: 0 }));
    expect(zero).toBe('Enemies · 0');
    expect(zero).toMatch(/^Enemies \u00b7 0$/);
    expect(zero).toContain(' \u00b7 ');
    expect(zero).not.toContain('  ·  ');

    // Distinct from Army · / Selected · / Vision · / Buildings · peers.
    expect(enemies).not.toBe(minimapArmyCountTipText(5));
    expect(minimapArmyCountTipText(5)).toBe('Army · 5');
    expect(minimapArmyCountTipText(5)).toMatch(/^Army \u00b7 /);
    expect(enemies).not.toBe(minimapSelectedCountTipText(5));
    expect(minimapSelectedCountTipText(5)).toBe('Selected · 5');
    expect(minimapSelectedCountTipText(5)).toMatch(/^Selected \u00b7 /);
    expect(enemies).not.toBe(minimapVisionTipText(5));
    expect(minimapVisionTipText(5)).toBe('Vision · 5');
    expect(minimapVisionTipText(5)).toMatch(/^Vision \u00b7 /);
    expect(enemies).not.toBe(minimapBuildingCountTipText(5));
    expect(minimapBuildingCountTipText(5)).toBe('Buildings · 5');
    expect(minimapBuildingCountTipText(5)).toMatch(/^Buildings \u00b7 /);
    expect(enemies).not.toMatch(/^Army \u00b7 /);
    expect(enemies).not.toMatch(/^Selected \u00b7 /);
    expect(enemies).not.toMatch(/^Vision \u00b7 /);
    expect(enemies).not.toMatch(/^Buildings \u00b7 /);
  });

  it('localizes Enemies · middot for pt-BR and es; stays distinct from Army · / Selected · / Vision · / Buildings ·', () => {
    setLocale('pt-BR');
    const enemiesPt = minimapEnemyCountTipText(5);
    expect(enemiesPt).toBe(t('hud.minimapEnemies', { n: 5 }));
    expect(enemiesPt).toBe('Inimigos · 5');
    expect(enemiesPt).toMatch(/^Inimigos \u00b7 /);
    expect(enemiesPt).toMatch(/^Inimigos \u00b7 5$/);
    expect(enemiesPt).toContain(' \u00b7 ');
    expect(enemiesPt).not.toContain('  ·  ');

    expect(enemiesPt).not.toBe(minimapArmyCountTipText(5));
    expect(minimapArmyCountTipText(5)).toBe('Tropa · 5');
    expect(minimapArmyCountTipText(5)).toMatch(/^Tropa \u00b7 /);
    expect(enemiesPt).not.toBe(minimapSelectedCountTipText(5));
    expect(minimapSelectedCountTipText(5)).toBe('Selecionados · 5');
    expect(minimapSelectedCountTipText(5)).toMatch(/^Selecionados \u00b7 /);
    expect(enemiesPt).not.toBe(minimapVisionTipText(5));
    expect(minimapVisionTipText(5)).toBe('Visão · 5');
    expect(minimapVisionTipText(5)).toMatch(/^Visão \u00b7 /);
    expect(enemiesPt).not.toBe(minimapBuildingCountTipText(5));
    expect(minimapBuildingCountTipText(5)).toBe('Prédios · 5');
    expect(minimapBuildingCountTipText(5)).toMatch(/^Prédios \u00b7 /);
    expect(enemiesPt).not.toMatch(/^Tropa \u00b7 /);
    expect(enemiesPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(enemiesPt).not.toMatch(/^Visão \u00b7 /);
    expect(enemiesPt).not.toMatch(/^Prédios \u00b7 /);

    setLocale('es');
    const enemiesEs = minimapEnemyCountTipText(5);
    expect(enemiesEs).toBe(t('hud.minimapEnemies', { n: 5 }));
    expect(enemiesEs).toBe('Enemigos · 5');
    expect(enemiesEs).toMatch(/^Enemigos \u00b7 /);
    expect(enemiesEs).toMatch(/^Enemigos \u00b7 5$/);
    expect(enemiesEs).toContain(' \u00b7 ');
    expect(enemiesEs).not.toContain('  ·  ');

    expect(enemiesEs).not.toBe(minimapArmyCountTipText(5));
    expect(minimapArmyCountTipText(5)).toBe('Tropa · 5');
    expect(minimapArmyCountTipText(5)).toMatch(/^Tropa \u00b7 /);
    expect(enemiesEs).not.toBe(minimapSelectedCountTipText(5));
    expect(minimapSelectedCountTipText(5)).toBe('Seleccionados · 5');
    expect(minimapSelectedCountTipText(5)).toMatch(/^Seleccionados \u00b7 /);
    expect(enemiesEs).not.toBe(minimapVisionTipText(5));
    expect(minimapVisionTipText(5)).toBe('Visión · 5');
    expect(minimapVisionTipText(5)).toMatch(/^Visión \u00b7 /);
    expect(enemiesEs).not.toBe(minimapBuildingCountTipText(5));
    expect(minimapBuildingCountTipText(5)).toBe('Edificios · 5');
    expect(minimapBuildingCountTipText(5)).toMatch(/^Edificios \u00b7 /);
    expect(enemiesEs).not.toMatch(/^Tropa \u00b7 /);
    expect(enemiesEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(enemiesEs).not.toMatch(/^Visión \u00b7 /);
    expect(enemiesEs).not.toMatch(/^Edificios \u00b7 /);
  });
});

describe('countVisibleEnemies', () => {
  it('counts living fog-revealed enemies only', () => {
    const fog = createFogState();
    const world = {
      fog,
      units: [
        { team: 'enemy', hp: 10, x: 40, y: 40 },
        { team: 'enemy', hp: 10, x: 40, y: 40 },
        { team: 'enemy', hp: 0, x: 40, y: 40 },
        { team: 'enemy', hp: 10, x: 2000, y: 2000 },
        { team: 'player', hp: 10, x: 40, y: 40 },
      ],
    } as Parameters<typeof countVisibleEnemies>[0];

    expect(countVisibleEnemies(world)).toBe(0);

    const cell = worldToFog(40, 40);
    fog.visible[cell.cy * FOG_COLS + cell.cx] = 1;
    expect(countVisibleEnemies(world)).toBe(2);
  });
});
