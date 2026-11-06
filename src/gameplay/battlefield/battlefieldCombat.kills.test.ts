import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from './battlefieldWorld';
import { tickBattlefieldCombat } from './battlefieldCombat';

describe('player kill / loss tallies', () => {
  it('counts enemy unit deaths as kills and player deaths as losses', () => {
    const world = createBattlefieldWorld('brutes', 'practice');
    const player = world.units.find((u) => u.team === 'player' && !u.canGather);
    const enemy = world.units.find((u) => u.team === 'enemy' && !u.canGather);
    expect(player).toBeTruthy();
    expect(enemy).toBeTruthy();

    enemy!.hp = 0;
    tickBattlefieldCombat(world, 16);
    expect(world.playerUnitKills).toBe(1);
    expect(world.playerUnitLosses).toBe(0);

    player!.hp = 0;
    tickBattlefieldCombat(world, 16);
    expect(world.playerUnitKills).toBe(1);
    expect(world.playerUnitLosses).toBe(1);
  });
});
