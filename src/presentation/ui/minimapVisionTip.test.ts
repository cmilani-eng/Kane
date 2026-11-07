import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { unitVisionLabel, visionTiles } from './unitVision';
import {
  maxPlayerVisionTiles,
  minimapVisionTipText,
} from './minimapVisionTip';

describe('minimapVisionTipText', () => {
  it('labels Vision · n, distinct from selection Sight · tip', () => {
    expect(minimapVisionTipText(5)).toBe(t('hud.minimapVision', { n: 5 }));
    expect(minimapVisionTipText(5)).toMatch(/^Vision ·/);
    expect(minimapVisionTipText(0)).toBe(t('hud.minimapVision', { n: 0 }));
    expect(minimapVisionTipText(5)).not.toBe(t('sel.visionTip', { n: 5 }));
    expect(minimapVisionTipText(5)).not.toBe(unitVisionLabel('scavenger'));
  });

  it('localizes Vision middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(minimapVisionTipText(4)).toBe(t('hud.minimapVision', { n: 4 }));
    expect(minimapVisionTipText(4)).toMatch(/^Visão ·/);
    setLocale('es');
    expect(minimapVisionTipText(4)).toBe(t('hud.minimapVision', { n: 4 }));
    expect(minimapVisionTipText(4)).toMatch(/^Visión ·/);
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
