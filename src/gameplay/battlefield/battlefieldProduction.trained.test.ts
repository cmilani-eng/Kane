import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from './battlefieldWorld';
import { queueTrain, tickProduction } from './battlefieldProduction';

describe('player units trained tally', () => {
  it('counts production completions for the player team only', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing');
    const hall = world.buildings.find(
      (b) => b.team === 'player' && b.complete,
    )!;
    expect(queueTrain(world, hall, 'scavenger')).toBe(true);
    expect(world.playerUnitsTrained).toBe(0);
    // Advance past scavenger trainMs.
    tickProduction(world, 60_000);
    expect(world.playerUnitsTrained).toBe(1);
  });
});
