import { describe, expect, it } from 'vitest';
import { placeBuilding, tickBuildings } from './battlefieldBuildings';
import { createBattlefieldWorld } from './battlefieldWorld';

describe('player buildings raised tally', () => {
  it('counts construction completions for the player team only', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing');
    expect(world.playerBuildingsRaised).toBe(0);
    const shed = placeBuilding(world, 'player', 'beast_pen', 900, 200);
    expect(shed).not.toBeNull();
    expect(world.playerBuildingsRaised).toBe(0);
    tickBuildings(world, 120_000);
    expect(world.playerBuildingsRaised).toBe(1);

    const enemy = placeBuilding(world, 'enemy', 'beast_pen', 1400, 200);
    expect(enemy).not.toBeNull();
    tickBuildings(world, 120_000);
    expect(world.playerBuildingsRaised).toBe(1);
  });
});
