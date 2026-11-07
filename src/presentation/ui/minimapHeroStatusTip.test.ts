import { describe, expect, it } from 'vitest';
import {
  createBattlefieldWorld,
  spawnUnit,
} from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';
import {
  minimapHeroStatus,
  minimapHeroStatusTipText,
} from './minimapHeroStatusTip';

describe('minimapHeroStatusTipText', () => {
  it('labels Ready / Down / sector', () => {
    expect(minimapHeroStatusTipText({ kind: 'ready' })).toBe(
      t('hud.minimapHeroReady'),
    );
    expect(minimapHeroStatusTipText({ kind: 'ready' })).toMatch(/^Hero ·/);
    expect(minimapHeroStatusTipText({ kind: 'down' })).toBe(
      t('hud.minimapHeroDown'),
    );
    expect(minimapHeroStatusTipText({ kind: 'live', sector: 'NW' })).toBe(
      t('hud.minimapHeroSector', { sector: 'NW' }),
    );
  });
});

describe('minimapHeroStatus', () => {
  it('is Ready before recruit, sector while alive, Down after death', () => {
    const world = createBattlefieldWorld('brutes', 'practice');
    expect(minimapHeroStatus(world)).toEqual({ kind: 'ready' });
    expect(minimapHeroStatusTipText(minimapHeroStatus(world))).toBe(
      t('hud.minimapHeroReady'),
    );

    const hero = spawnUnit(world, {
      team: 'player',
      typeId: 'gruk',
      x: 100,
      y: 100,
      color: 0xc45c26,
    });
    world.heroRuntime = {
      heroId: 'gruk',
      unitId: hero.id,
      cds: { ability1: 0, ability2: 0, ultimate: 0 },
      angryUntilMs: 0,
      orderUntilMs: 0,
      decreeUntilMs: 0,
      chaosUntilMs: 0,
      chaosX: 0,
      chaosY: 0,
      chaosRadius: 0,
      chaosTickMs: 0,
    };
    world.playerHeroDown = false;
    const live = minimapHeroStatus(world);
    expect(live.kind).toBe('live');
    if (live.kind === 'live') {
      expect(minimapHeroStatusTipText(live)).toBe(
        t('hud.minimapHeroSector', { sector: live.sector }),
      );
    }

    hero.hp = 0;
    world.heroRuntime = null;
    world.playerHeroDown = true;
    expect(minimapHeroStatus(world)).toEqual({ kind: 'down' });
    expect(minimapHeroStatusTipText(minimapHeroStatus(world))).toBe(
      t('hud.minimapHeroDown'),
    );
  });
});
