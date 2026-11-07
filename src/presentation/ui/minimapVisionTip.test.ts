import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { endVisionTipLine } from './endVisionTip';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapEnemyCountTipText } from './minimapEnemyCountTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapMatchClockTipText } from './minimapMatchClockTip';
import {
  maxPlayerVisionTiles,
  minimapVisionTipText,
} from './minimapVisionTip';
import { unitVisionLabel, visionTiles } from './unitVision';

describe('minimapVisionTipText', () => {
  it('labels Vision · n with middot, distinct from Sight · / Fog · % / Enemies · / Army · / Time ·', () => {
    expect(minimapVisionTipText(5)).toBe(t('hud.minimapVision', { n: 5 }));
    expect(minimapVisionTipText(5)).toBe('Vision · 5');
    expect(minimapVisionTipText(5)).toMatch(/^Vision \u00b7 /);
    expect(minimapVisionTipText(0)).toBe(t('hud.minimapVision', { n: 0 }));
    expect(minimapVisionTipText(0)).toBe('Vision · 0');
    expect(minimapVisionTipText(0)).toMatch(/^Vision \u00b7 /);

    const vision = minimapVisionTipText(5);
    expect(vision).not.toBe(t('sel.visionTip', { n: 5 }));
    expect(vision).not.toBe(unitVisionLabel('scavenger'));
    expect(t('sel.visionTip', { n: 5 })).toBe('Sight · 5');
    expect(t('sel.visionTip', { n: 5 })).toMatch(/^Sight \u00b7 /);
    expect(vision).not.toBe(minimapFogCoverageTipText(5));
    expect(minimapFogCoverageTipText(5)).toBe('Fog · 5%');
    expect(minimapFogCoverageTipText(5)).toMatch(/^Fog \u00b7 /);
    expect(vision).not.toBe(minimapEnemyCountTipText(5));
    expect(minimapEnemyCountTipText(5)).toBe('Enemies · 5');
    expect(minimapEnemyCountTipText(5)).toMatch(/^Enemies \u00b7 /);
    expect(vision).not.toBe(minimapArmyCountTipText(5));
    expect(minimapArmyCountTipText(5)).toBe('Army · 5');
    expect(minimapArmyCountTipText(5)).toMatch(/^Army \u00b7 /);
    expect(vision).not.toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe('Time · 2:05');
    expect(minimapMatchClockTipText(125_000)).toMatch(/^Time \u00b7 /);

    expect(vision).not.toMatch(/^Sight \u00b7 /);
    expect(vision).not.toMatch(/^Fog \u00b7 /);
    expect(vision).not.toMatch(/^Enemies \u00b7 /);
    expect(vision).not.toMatch(/^Army \u00b7 /);
    expect(vision).not.toMatch(/^Time \u00b7 /);

    // Same en copy as end tip; distinct i18n key / surface.
    expect(vision).toBe(endVisionTipLine(5));
    expect(endVisionTipLine(5)).toBe(t('end.visionTip', { n: 5 }));
    expect(endVisionTipLine(5)).toBe('Vision · 5');
    expect(endVisionTipLine(5)).toMatch(/^Vision \u00b7 /);
    expect(t('hud.minimapVision', { n: 1 })).toBe(t('end.visionTip', { n: 1 }));
  });

  it('localizes Vision middot for pt-BR and es; stays distinct from Fog / Enemies / Army / Time', () => {
    setLocale('pt-BR');
    expect(minimapVisionTipText(4)).toBe(t('hud.minimapVision', { n: 4 }));
    expect(minimapVisionTipText(4)).toBe('Visão · 4');
    expect(minimapVisionTipText(4)).toMatch(/^Visão \u00b7 /);

    const visionPt = minimapVisionTipText(4);
    expect(visionPt).not.toBe(minimapFogCoverageTipText(4));
    expect(minimapFogCoverageTipText(4)).toBe('Névoa · 4%');
    expect(minimapFogCoverageTipText(4)).toMatch(/^Névoa \u00b7 /);
    expect(visionPt).not.toBe(minimapEnemyCountTipText(4));
    expect(minimapEnemyCountTipText(4)).toBe('Inimigos · 4');
    expect(minimapEnemyCountTipText(4)).toMatch(/^Inimigos \u00b7 /);
    expect(visionPt).not.toBe(minimapArmyCountTipText(4));
    expect(minimapArmyCountTipText(4)).toBe('Tropa · 4');
    expect(minimapArmyCountTipText(4)).toMatch(/^Tropa \u00b7 /);
    expect(visionPt).not.toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe('Tempo · 2:05');
    expect(minimapMatchClockTipText(125_000)).toMatch(/^Tempo \u00b7 /);
    expect(visionPt).not.toMatch(/^Névoa \u00b7 /);
    expect(visionPt).not.toMatch(/^Inimigos \u00b7 /);
    expect(visionPt).not.toMatch(/^Tropa \u00b7 /);
    expect(visionPt).not.toMatch(/^Tempo \u00b7 /);
    // Same pt-BR copy as end tip / selection Sight ·; distinct i18n keys.
    expect(visionPt).toBe(endVisionTipLine(4));
    expect(endVisionTipLine(4)).toBe(t('end.visionTip', { n: 4 }));
    expect(t('hud.minimapVision', { n: 4 })).toBe(t('sel.visionTip', { n: 4 }));
    expect(t('hud.minimapVision', { n: 1 })).toBe(t('end.visionTip', { n: 1 }));

    setLocale('es');
    expect(minimapVisionTipText(4)).toBe(t('hud.minimapVision', { n: 4 }));
    expect(minimapVisionTipText(4)).toBe('Visión · 4');
    expect(minimapVisionTipText(4)).toMatch(/^Visión \u00b7 /);

    const visionEs = minimapVisionTipText(4);
    expect(visionEs).not.toBe(minimapFogCoverageTipText(4));
    expect(minimapFogCoverageTipText(4)).toBe('Niebla · 4%');
    expect(minimapFogCoverageTipText(4)).toMatch(/^Niebla \u00b7 /);
    expect(visionEs).not.toBe(minimapEnemyCountTipText(4));
    expect(minimapEnemyCountTipText(4)).toBe('Enemigos · 4');
    expect(minimapEnemyCountTipText(4)).toMatch(/^Enemigos \u00b7 /);
    expect(visionEs).not.toBe(minimapArmyCountTipText(4));
    expect(minimapArmyCountTipText(4)).toBe('Tropa · 4');
    expect(minimapArmyCountTipText(4)).toMatch(/^Tropa \u00b7 /);
    expect(visionEs).not.toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe('Tiempo · 2:05');
    expect(minimapMatchClockTipText(125_000)).toMatch(/^Tiempo \u00b7 /);
    expect(visionEs).not.toMatch(/^Niebla \u00b7 /);
    expect(visionEs).not.toMatch(/^Enemigos \u00b7 /);
    expect(visionEs).not.toMatch(/^Tropa \u00b7 /);
    expect(visionEs).not.toMatch(/^Tiempo \u00b7 /);
    expect(visionEs).toBe(endVisionTipLine(4));
    expect(endVisionTipLine(4)).toBe(t('end.visionTip', { n: 4 }));
    expect(t('hud.minimapVision', { n: 4 })).toBe(t('sel.visionTip', { n: 4 }));
    expect(t('hud.minimapVision', { n: 1 })).toBe(t('end.visionTip', { n: 1 }));
    setLocale('en-GB');
  });
});

describe('maxPlayerVisionTiles', () => {
  it('takes the max living player vision in tiles', () => {
    const world = {
      units: [
        { team: 'player', hp: 10, vision: 160 },
        { team: 'player', hp: 10, vision: 320 },
        { team: 'player', hp: 0, vision: 999 },
        { team: 'enemy', hp: 10, vision: 800 },
      ],
    } as Parameters<typeof maxPlayerVisionTiles>[0];
    expect(maxPlayerVisionTiles(world)).toBe(visionTiles(320));
  });
});
