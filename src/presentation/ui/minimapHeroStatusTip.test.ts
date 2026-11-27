import { describe, expect, it } from 'vitest';
import {
  createBattlefieldWorld,
  spawnUnit,
} from '../../gameplay/battlefield/battlefieldWorld';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapCameraSectorTipText } from './minimapCameraSectorTip';
import {
  minimapHeroStatus,
  minimapHeroStatusTipText,
  type MinimapHeroStatus,
} from './minimapHeroStatusTip';
import { minimapPingSectorTipText } from './minimapPingSectorTip';
import { minimapScoutPulseLabelText } from './minimapScoutPulseLabel';
import { pauseHeroStatusTipLine } from './pauseHeroStatusTip';

describe('minimapHeroStatusTipText', () => {
  it('labels Hero · Ready / Down / sector with middot, distinct from Cam · / Scout · / Mark · / Army ·', () => {
    const ready: MinimapHeroStatus = { kind: 'ready' };
    const down: MinimapHeroStatus = { kind: 'down' };
    const live: MinimapHeroStatus = { kind: 'live', sector: 'NW' };

    expect(minimapHeroStatusTipText(ready)).toBe(t('hud.minimapHeroReady'));
    expect(minimapHeroStatusTipText(ready)).toBe('Hero · Ready');
    expect(minimapHeroStatusTipText(ready)).toMatch(/^Hero \u00b7 /);
    expect(minimapHeroStatusTipText(down)).toBe(t('hud.minimapHeroDown'));
    expect(minimapHeroStatusTipText(down)).toBe('Hero · Down');
    expect(minimapHeroStatusTipText(down)).toMatch(/^Hero \u00b7 /);
    expect(minimapHeroStatusTipText(live)).toBe(
      t('hud.minimapHeroSector', { sector: 'NW' }),
    );
    expect(minimapHeroStatusTipText(live)).toBe('Hero · NW');
    expect(minimapHeroStatusTipText(live)).toMatch(/^Hero \u00b7 /);

    const liveTip = minimapHeroStatusTipText(live);
    expect(liveTip).not.toBe(minimapCameraSectorTipText('NW'));
    expect(liveTip).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(liveTip).not.toBe(minimapPingSectorTipText('NW'));
    expect(liveTip).not.toBe(minimapArmyCountTipText(1));
    expect(liveTip).not.toMatch(/^Cam \u00b7 /);
    expect(liveTip).not.toMatch(/^Scout \u00b7 /);
    expect(liveTip).not.toMatch(/^Mark \u00b7 /);
    expect(liveTip).not.toMatch(/^Army \u00b7 /);

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

  it('localizes Hero middot for pt-BR and es; stays distinct from Cam / Scout / Mark / Army', () => {
    const ready: MinimapHeroStatus = { kind: 'ready' };
    const down: MinimapHeroStatus = { kind: 'down' };
    const live: MinimapHeroStatus = { kind: 'live', sector: 'NW' };

    setLocale('pt-BR');
    expect(minimapHeroStatusTipText(ready)).toBe(t('hud.minimapHeroReady'));
    expect(minimapHeroStatusTipText(ready)).toBe('Herói · Pronto');
    expect(minimapHeroStatusTipText(ready)).toMatch(/^Herói \u00b7 /);
    expect(minimapHeroStatusTipText(down)).toBe('Herói · Caído');
    expect(minimapHeroStatusTipText(down)).toMatch(/^Herói \u00b7 /);
    expect(minimapHeroStatusTipText(live)).toBe('Herói · NW');
    expect(minimapHeroStatusTipText(live)).toMatch(/^Herói \u00b7 /);

    const livePt = minimapHeroStatusTipText(live);
    expect(livePt).not.toBe(minimapCameraSectorTipText('NW'));
    expect(livePt).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(livePt).not.toBe(minimapPingSectorTipText('NW'));
    expect(livePt).not.toBe(minimapArmyCountTipText(1));
    expect(livePt).not.toMatch(/^Câm \u00b7 /);
    expect(livePt).not.toMatch(/^Revela \u00b7 /);
    expect(livePt).not.toMatch(/^Marca \u00b7 /);
    expect(livePt).not.toMatch(/^Tropa \u00b7 /);
    expect(minimapHeroStatusTipText(ready)).toBe(pauseHeroStatusTipLine(ready));
    expect(pauseHeroStatusTipLine(ready)).toBe(t('pause.heroReady'));

    setLocale('es');
    expect(minimapHeroStatusTipText(ready)).toBe(t('hud.minimapHeroReady'));
    expect(minimapHeroStatusTipText(ready)).toBe('Héroe · Listo');
    expect(minimapHeroStatusTipText(ready)).toMatch(/^Héroe \u00b7 /);
    expect(minimapHeroStatusTipText(down)).toBe('Héroe · Caído');
    expect(minimapHeroStatusTipText(down)).toMatch(/^Héroe \u00b7 /);
    expect(minimapHeroStatusTipText(live)).toBe('Héroe · NW');
    expect(minimapHeroStatusTipText(live)).toMatch(/^Héroe \u00b7 /);

    const liveEs = minimapHeroStatusTipText(live);
    expect(liveEs).not.toBe(minimapCameraSectorTipText('NW'));
    expect(liveEs).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(liveEs).not.toBe(minimapPingSectorTipText('NW'));
    expect(liveEs).not.toBe(minimapArmyCountTipText(1));
    expect(liveEs).not.toMatch(/^Cám \u00b7 /);
    expect(liveEs).not.toMatch(/^Explora \u00b7 /);
    expect(liveEs).not.toMatch(/^Marca \u00b7 /);
    expect(liveEs).not.toMatch(/^Tropa \u00b7 /);
    expect(minimapHeroStatusTipText(ready)).toBe(pauseHeroStatusTipLine(ready));
    expect(pauseHeroStatusTipLine(ready)).toBe(t('pause.heroReady'));
    setLocale('en-GB');
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
