import { describe, expect, it } from 'vitest';
import {
  createBattlefieldWorld,
  spawnUnit,
} from '../../gameplay/battlefield/battlefieldWorld';
import { buildSelectionView } from './selectionPanel';
import { t } from '../../i18n';

describe('hero ability cooldown on selection', () => {
  it('appends remaining cooldown seconds to the hotkey tip', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const hero = spawnUnit(world, {
      team: 'player',
      typeId: 'gruk',
      x: 100,
      y: 100,
      color: 0xc45c26,
    });
    hero.selected = true;
    world.heroRuntime = {
      heroId: 'gruk',
      unitId: hero.id,
      cds: { ability1: 3500, ability2: 0, ultimate: 12_400 },
      angryUntilMs: 0,
      orderUntilMs: 0,
      decreeUntilMs: 0,
      chaosUntilMs: 0,
      chaosX: 0,
      chaosY: 0,
      chaosRadius: 0,
      chaosTickMs: 0,
    };

    const view = buildSelectionView(world, null, [hero], false);
    expect(view.kind).toBe('units');
    if (view.kind !== 'units') return;
    expect(view.controlHint).toContain(t('hud.heroCd', { sec: 4 }));
    expect(view.controlHint).toContain(t('hud.heroCd', { sec: 13 }));
    expect(view.abilities?.find((a) => a.slot === 'ability1')?.cdSec).toBe(4);
    expect(view.abilities?.find((a) => a.slot === 'ultimate')?.cdSec).toBe(13);
    expect(view.abilities?.find((a) => a.slot === 'ability2')?.ready).toBe(true);
  });

  it('omits cooldown markers when all abilities are ready', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const hero = spawnUnit(world, {
      team: 'player',
      typeId: 'gruk',
      x: 120,
      y: 120,
      color: 0xc45c26,
    });
    hero.selected = true;
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

    const view = buildSelectionView(world, null, [hero], false);
    expect(view.kind).toBe('units');
    if (view.kind !== 'units') return;
    expect(view.controlHint).not.toMatch(/\(\d+s\)/);
  });
});
