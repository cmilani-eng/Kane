import { describe, expect, it } from 'vitest';
import {
  createBattlefieldWorld,
  spawnUnit,
} from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';
import {
  minimapHeroStatus,
  minimapHeroStatusTipText,
  type MinimapHeroStatus,
} from './minimapHeroStatusTip';
import { pauseHeroStatusTipLine } from './pauseHeroStatusTip';

describe('minimapHeroStatusTipText', () => {
  it('labels Ready / Down / sector, distinct from pause tip keys', () => {
    const ready: MinimapHeroStatus = { kind: 'ready' };
    const down: MinimapHeroStatus = { kind: 'down' };
    const live: MinimapHeroStatus = { kind: 'live', sector: 'NW' };

    expect(minimapHeroStatusTipText(ready)).toBe(t('hud.minimapHeroReady'));
    expect(minimapHeroStatusTipText(ready)).toMatch(/^Hero ·/);
    expect(minimapHeroStatusTipText(down)).toBe(t('hud.minimapHeroDown'));
    expect(minimapHeroStatusTipText(live)).toBe(
      t('hud.minimapHeroSector', { sector: 'NW' }),
    );

    // Same en copy as pause tip; distinct i18n key / surface.
    expect(minimapHeroStatusTipText(ready)).toBe(pauseHeroStatusTipLine(ready));
    expect(pauseHeroStatusTipLine(ready)).toBe(t('pause.heroReady'));
    expect(minimapHeroStatusTipText(down)).toBe(pauseHeroStatusTipLine(down));
    expect(pauseHeroStatusTipLine(down)).toBe(t('pause.heroDown'));
    expect(minimapHeroStatusTipText(live)).toBe(pauseHeroStatusTipLine(live));
    expect(pauseHeroStatusTipLine(live)).toBe(
      t('pause.heroSector', { sector: 'NW' }),
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
