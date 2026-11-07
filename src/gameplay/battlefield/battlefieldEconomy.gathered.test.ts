import { describe, expect, it } from 'vitest';
import { tickBattlefieldEconomy } from './battlefieldEconomy';
import { createBattlefieldWorld } from './battlefieldWorld';

describe('player gather tallies', () => {
  it('counts Keep deposits toward gold and crystal gathered', () => {
    const world = createBattlefieldWorld('brutes', 'practice');
    const worker = world.units.find((u) => u.team === 'player' && u.canGather);
    const pile = world.stockpiles.find((s) => s.team === 'player');
    expect(worker).toBeTruthy();
    expect(pile).toBeTruthy();

    worker!.x = pile!.x;
    worker!.y = pile!.y;
    worker!.carrying = 8;
    worker!.carryingResource = 'gold';
    worker!.path = [];
    worker!.moveTarget = null;

    tickBattlefieldEconomy(world);
    expect(world.playerGoldGathered).toBe(8);
    expect(world.playerCrystalsGathered).toBe(0);

    worker!.carrying = 5;
    worker!.carryingResource = 'magic_crystals';
    tickBattlefieldEconomy(world);
    expect(world.playerGoldGathered).toBe(8);
    expect(world.playerCrystalsGathered).toBe(5);
  });
});
