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
    expect(SKIRMISH_MAP_ORDER).toEqual(['crossing', 'ridge', 'gap']);
    expect(SKIRMISH_MAPS.crossing.tileSeed).not.toBe(SKIRMISH_MAPS.ridge.tileSeed);
    expect(SKIRMISH_MAPS.crossing.playerBase).not.toEqual(
      SKIRMISH_MAPS.ridge.playerBase,
    );
    expect(SKIRMISH_MAPS.crossing.enemyBase).not.toEqual(
      SKIRMISH_MAPS.ridge.enemyBase,
    );
    expect(SKIRMISH_MAPS.gap.playerBase.x).toBeLessThan(SKIRMISH_MAPS.gap.enemyBase.x);
    expect(SKIRMISH_MAPS.gap.playerBase.y).toBe(SKIRMISH_MAPS.gap.enemyBase.y);
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
    const gap = createBattlefieldWorld('brutes', 'normal', 'gap');
    const hallG = gap.buildings.find((x) => x.team === 'player')!;
    const enemyG = gap.buildings.find((x) => x.team === 'enemy')!;
    expect(gap.mapId).toBe('gap');
    expect(hallG.x).toBeLessThan(enemyG.x);
    expect(gap.coreFragments.length).toBe(3);
  });

  it('scatters rich gold veins on every map', () => {
    for (const id of SKIRMISH_MAP_ORDER) {
      const gold = SKIRMISH_MAPS[id].nodes.filter((n) => n.resourceId === 'gold');
      expect(gold.length).toBeGreaterThanOrEqual(8);
      for (const vein of gold) expect(vein.amount).toBeGreaterThanOrEqual(900);
    }
  });

  it('scatters rich magic crystal veins on every map', () => {
    for (const id of SKIRMISH_MAP_ORDER) {
      const crystals = SKIRMISH_MAPS[id].nodes.filter((n) => n.resourceId === 'magic_crystals');
      expect(crystals.length).toBeGreaterThanOrEqual(8);
      for (const vein of crystals) expect(vein.amount).toBeGreaterThanOrEqual(500);
    }
  });

  it('falls back to the default map for unknown ids', () => {
    expect(getSkirmishMap('nope').id).toBe(DEFAULT_SKIRMISH_MAP);
    expect(getSkirmishMap(null).id).toBe('crossing');
  });
});
