import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAP } from '../../config/balance';
import { loadMatchPrefs, saveMatchPrefs } from '../../database/matchPrefs';
import { getBuildingType } from '../../data/buildings';
import { createBattlefieldWorld } from './battlefieldWorld';

function hall(world: ReturnType<typeof createBattlefieldWorld>, team: 'player' | 'enemy') {
  const found = world.buildings.find(
    (b) => b.team === team && getBuildingType(b.typeId).isMainHall,
  );
  if (!found) throw new Error(`missing ${team} hall`);
  return found;
}

function stock(world: ReturnType<typeof createBattlefieldWorld>, id: 'gold' | 'magic_crystals') {
  return world.nodes
    .filter((n) => n.resourceId === id)
    .reduce((sum, n) => sum + n.maxAmount, 0);
}

describe('skirmish maps', () => {
  it('keeps Meadow in the south and moves Ford to opposite corners', () => {
    const meadow = createBattlefieldWorld('brutes', 'normal', 'meadow');
    const ford = createBattlefieldWorld('brutes', 'normal', 'ford');

    expect(meadow.mapId).toBe('meadow');
    expect(ford.mapId).toBe('ford');
    expect(hall(meadow, 'player').y).toBeGreaterThan(hall(ford, 'player').y + 400);
    expect(hall(ford, 'enemy').x).toBeGreaterThan(hall(meadow, 'enemy').x + 400);
    expect(ford.nodes).toHaveLength(meadow.nodes.length);
    expect(ford.coreFragments.map((c) => c.x)).not.toEqual(
      meadow.coreFragments.map((c) => c.x),
    );
    expect(stock(ford, 'gold')).toBe(stock(meadow, 'gold'));
    expect(stock(ford, 'magic_crystals')).toBe(stock(meadow, 'magic_crystals'));

    for (const n of ford.nodes) {
      expect(n.x).toBeGreaterThan(20);
      expect(n.x).toBeLessThan(MAP.width - 20);
      expect(n.y).toBeGreaterThan(20);
      expect(n.y).toBeLessThan(MAP.height - 20);
    }
  });
});

describe('match prefs map', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('remembers Ford and treats an unknown map as Meadow', () => {
    const mem = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });

    saveMatchPrefs({ version: 1, species: 'brutes', map: 'ford', difficulty: 'hard' });
    expect(loadMatchPrefs().map).toBe('ford');

    mem.set(
      'kane.matchPrefs.v1',
      JSON.stringify({ version: 1, species: 'nobles', map: 'nope', difficulty: 'easy' }),
    );
    expect(loadMatchPrefs()).toMatchObject({ species: 'nobles', map: 'meadow', difficulty: 'easy' });
  });
});
