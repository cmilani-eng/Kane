import { describe, expect, it } from 'vitest';
import { damageBuilding, placeBuilding, tickBuildings } from './battlefieldBuildings';
import { createBattlefieldWorld } from './battlefieldWorld';

describe('player buildings lost tally', () => {
  it('counts player building destructions only', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing');
    expect(world.playerBuildingsLost).toBe(0);
    const shed = placeBuilding(world, 'player', 'beast_pen', 900, 200)!;
    tickBuildings(world, 120_000);
    expect(shed.complete).toBe(true);
    damageBuilding(world, shed, shed.maxHp + 1);
    expect(world.playerBuildingsLost).toBe(1);

    const enemy = placeBuilding(world, 'enemy', 'beast_pen', 1400, 200)!;
    tickBuildings(world, 120_000);
    damageBuilding(world, enemy, enemy.maxHp + 1);
    expect(world.playerBuildingsLost).toBe(1);
  });
});
