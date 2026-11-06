import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from '../gameplay/battlefield/battlefieldWorld';
import {
  DEFAULT_SKIRMISH_MAP,
  getSkirmishMap,
  SKIRMISH_MAP_ORDER,
  SKIRMISH_MAPS,
} from './skirmishMaps';

describe('skirmish maps', () => {
  it('lists two distinct selectable layouts', () => {
    expect(SKIRMISH_MAP_ORDER).toEqual(['crossing', 'ridge']);
    expect(SKIRMISH_MAPS.crossing.tileSeed).not.toBe(SKIRMISH_MAPS.ridge.tileSeed);
    expect(SKIRMISH_MAPS.crossing.playerBase).not.toEqual(
      SKIRMISH_MAPS.ridge.playerBase,
    );
    expect(SKIRMISH_MAPS.crossing.enemyBase).not.toEqual(
      SKIRMISH_MAPS.ridge.enemyBase,
    );
  });

  it('seeds different base halls for ridge vs crossing', () => {
    const a = createBattlefieldWorld('brutes', 'normal', 'crossing');
    const b = createBattlefieldWorld('brutes', 'normal', 'ridge');
    expect(a.mapId).toBe('crossing');
    expect(b.mapId).toBe('ridge');
    const hallA = a.buildings.find((x) => x.team === 'player')!;
    const hallB = b.buildings.find((x) => x.team === 'player')!;
    expect(hallA.x).not.toBeCloseTo(hallB.x, 0);
    expect(a.nodes.length).toBeGreaterThan(0);
    expect(b.nodes.length).toBeGreaterThan(0);
    expect(a.coreFragments.length).toBe(3);
    expect(b.coreFragments.length).toBe(3);
  });

  it('falls back to the default map for unknown ids', () => {
    expect(getSkirmishMap('nope').id).toBe(DEFAULT_SKIRMISH_MAP);
    expect(getSkirmishMap(null).id).toBe('crossing');
  });
});
