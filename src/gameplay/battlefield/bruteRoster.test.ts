import { describe, expect, it } from 'vitest';
import { flags } from '../../config/flags';
import { placeableBuildings } from '../../data/buildings';
import { listSpecies } from '../../data/speciesStub';
import { getUnitType, UNIT_TYPES, type UnitTypeId } from '../../data/units';
import { placeBuilding } from './battlefieldBuildings';
import { queueTrain, tickProduction } from './battlefieldProduction';
import { createBattlefieldWorld, spawnUnit } from './battlefieldWorld';

function readyBrutes() {
  const world = createBattlefieldWorld('brutes', 'normal');
  world.wallet.gold = 5000;
  world.wallet.magic_crystals = 500;
  const pen = placeBuilding(world, 'player', 'beast_pen', 900, 200);
  const works = placeBuilding(world, 'player', 'scrap_works', 1200, 200);
  if (!pen || !works) throw new Error('roster buildings failed to place');
  pen.complete = true;
  pen.buildProgress = 1;
  works.complete = true;
  works.buildProgress = 1;
  return { world, pen, works };
}

describe('species roster contract', () => {
  it('lists only real units for that species', () => {
    for (const species of listSpecies()) {
      expect(species.unitIds.length).toBeGreaterThan(0);
      for (const id of species.unitIds) {
        const def = UNIT_TYPES[id as UnitTypeId];
        expect(def, id).toBeDefined();
        expect(def.speciesId).toBe(species.id);
      }
    }
  });
});

describe('brutes roster', () => {
  it('offers the pen and the scrap works after the hut', () => {
    expect(placeableBuildings('brutes')).toEqual([
      'bonker_hut',
      'beast_pen',
      'scrap_works',
      'big_boss_den',
    ]);
  });

  it('trains a wolf rider and a stomper that can rage', () => {
    const { world, pen, works } = readyBrutes();
    const before = world.units.length;

    expect(queueTrain(world, pen, 'wolf_rider')).toBe(true);
    expect(queueTrain(world, works, 'stomper')).toBe(true);
    tickProduction(world, getUnitType('wolf_rider').trainMs);
    tickProduction(world, getUnitType('stomper').trainMs);

    const trained = world.units.slice(before);
    expect(trained.map((u) => u.typeId)).toEqual(['wolf_rider', 'stomper']);
    expect(trained.every((u) => u.team === 'player')).toBe(true);
    expect(getUnitType('wolf_rider').canRage).toBe(true);
    expect(getUnitType('big_bonker').canRage).toBe(true);
    expect(getUnitType('boom_goblin').structureMult).toBeGreaterThan(1);
    expect(getUnitType('stomper').structureMult).toBeGreaterThan(1);
  });

  it('refuses another train once the team is at the unit cap', () => {
    const { world, pen } = readyBrutes();
    const alive = () => world.units.filter((u) => u.team === 'player').length;
    while (alive() < flags.unitCap) {
      spawnUnit(world, {
        team: 'player',
        typeId: 'bonker',
        x: 40,
        y: 40,
        color: 0x4a7a3a,
      });
    }
    const gold = world.wallet.gold;
    expect(queueTrain(world, pen, 'big_bonker')).toBe(false);
    expect(world.wallet.gold).toBe(gold);
    expect(pen.trainQueue).toEqual([]);
  });
});
