import { describe, expect, it } from 'vitest';
import {
  findUnitAtForTeam,
  findPlayerUnitAt,
  createBattlefieldWorld,
  selectedCount,
  selectedUnits,
} from './battlefieldWorld';
import { resultForTeam } from './battlefieldVictory';

describe('two sides of one match', () => {
  it('a match can be built with an explicit enemy species, not the opposite of the player', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing', 7, 'nobles');
    expect(world.speciesId).toBe('brutes');
    expect(world.enemySpeciesId).toBe('nobles');
  });

  it('without an override the enemy species is the opposite of the player species', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing', 7);
    expect(world.enemySpeciesId).not.toBe('brutes');
  });

  it('finds the nearest living unit of the team asked for', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing', 7);
    const enemy = world.units.find((u) => u.team === 'enemy')!;
    const found = findUnitAtForTeam(world, enemy.x, enemy.y, 'enemy');
    expect(found?.team).toBe('enemy');
    expect(findUnitAtForTeam(world, enemy.x, enemy.y, 'player')?.team ?? 'player').toBe('player');
  });

  it('still finds the player unit the way the single-player scene does', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing', 7);
    const mine = world.units.find((u) => u.team === 'player')!;
    expect(findPlayerUnitAt(world, mine.x, mine.y)).toBe(mine);
  });

  it('shows the result from the seat the viewer sits in', () => {
    expect(resultForTeam('victory', 'player')).toBe('victory');
    expect(resultForTeam('victory', 'enemy')).toBe('defeat');
    expect(resultForTeam('defeat', 'enemy')).toBe('victory');
    expect(resultForTeam('ongoing', 'enemy')).toBe('ongoing');
  });

  it('a friend who controls the enemy team sees and counts their own selection', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing', 7, 'nobles');
    world.controlTeam = 'enemy';
    const mine = world.units.find((u) => u.team === 'enemy')!;
    mine.selected = true;
    expect(selectedCount(world)).toBe(1);
    expect(selectedUnits(world)).toEqual([mine]);
  });
});
