import { describe, expect, it } from 'vitest';
import {
  createFogState,
  FOG_COLS,
  worldToFog,
} from '../../gameplay/battlefield/battlefieldFog';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import {
  countVisibleEnemies,
  minimapEnemyCountTipText,
} from './minimapEnemyCountTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { minimapVisionTipText } from './minimapVisionTip';

describe('minimapEnemyCountTipText', () => {
  it('labels Enemies · n with middot, distinct from Army · / Selected · / Vision ·', () => {
    expect(minimapEnemyCountTipText(5)).toBe(
      t('hud.minimapEnemies', { n: 5 }),
    );
    expect(minimapEnemyCountTipText(5)).toBe('Enemies · 5');
    expect(minimapEnemyCountTipText(5)).toMatch(/^Enemies \u00b7 /);
    expect(minimapEnemyCountTipText(0)).toBe(
      t('hud.minimapEnemies', { n: 0 }),
    );
    expect(minimapEnemyCountTipText(0)).toBe('Enemies · 0');
    expect(minimapEnemyCountTipText(0)).toMatch(/^Enemies \u00b7 /);

    const enemies = minimapEnemyCountTipText(5);
    expect(enemies).not.toBe(minimapArmyCountTipText(5));
    expect(enemies).not.toBe(minimapSelectedCountTipText(5));
    expect(enemies).not.toBe(minimapVisionTipText(5));
    expect(enemies).not.toMatch(/^Army \u00b7 /);
    expect(enemies).not.toMatch(/^Selected \u00b7 /);
    expect(enemies).not.toMatch(/^Vision \u00b7 /);
  });

  it('localizes Enemies middot for pt-BR and es; stays distinct from Army / Selected / Vision', () => {
    setLocale('pt-BR');
    expect(minimapEnemyCountTipText(5)).toBe(
      t('hud.minimapEnemies', { n: 5 }),
    );
    expect(minimapEnemyCountTipText(5)).toBe('Inimigos · 5');
    expect(minimapEnemyCountTipText(5)).toMatch(/^Inimigos \u00b7 /);

    const enemiesPt = minimapEnemyCountTipText(5);
    expect(enemiesPt).not.toBe(minimapArmyCountTipText(5));
    expect(enemiesPt).not.toBe(minimapSelectedCountTipText(5));
    expect(enemiesPt).not.toBe(minimapVisionTipText(5));
    expect(enemiesPt).not.toMatch(/^Tropa \u00b7 /);
    expect(enemiesPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(enemiesPt).not.toMatch(/^Visão \u00b7 /);

    setLocale('es');
    expect(minimapEnemyCountTipText(5)).toBe(
      t('hud.minimapEnemies', { n: 5 }),
    );
    expect(minimapEnemyCountTipText(5)).toBe('Enemigos · 5');
    expect(minimapEnemyCountTipText(5)).toMatch(/^Enemigos \u00b7 /);

    const enemiesEs = minimapEnemyCountTipText(5);
    expect(enemiesEs).not.toBe(minimapArmyCountTipText(5));
    expect(enemiesEs).not.toBe(minimapSelectedCountTipText(5));
    expect(enemiesEs).not.toBe(minimapVisionTipText(5));
    expect(enemiesEs).not.toMatch(/^Tropa \u00b7 /);
    expect(enemiesEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(enemiesEs).not.toMatch(/^Visión \u00b7 /);
    setLocale('en-GB');
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
