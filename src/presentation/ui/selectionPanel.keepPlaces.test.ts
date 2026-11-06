import { describe, expect, it } from 'vitest';
import { placeableBuildings } from '../../data/buildings';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { buildSelectionView } from './selectionPanel';

describe('Keep selection placeables', () => {
  it('lists placeable buildings with costs on the player main hall', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const keep = world.buildings.find(
      (b) => b.team === 'player' && b.typeId === 'junkyard',
    );
    expect(keep).toBeDefined();
    keep!.complete = true;
    keep!.buildProgress = 1;
    world.wallet.gold = 500;
    world.wallet.magic_crystals = 50;

    const view = buildSelectionView(world, keep!, [], false, false, null, null);
    expect(view.kind).toBe('building');
    if (view.kind !== 'building') return;

    const expected = placeableBuildings('brutes');
    expect(view.places.map((p) => p.typeId)).toEqual(expected);
    expect(view.places.length).toBeGreaterThan(0);
    for (const p of view.places) {
      expect(p.costGold).toBeGreaterThan(0);
      expect(p.armed).toBe(false);
      expect(p.affordable).toBe(p.canPay);
    }
  });

  it('marks the armed place type and skips places on non-halls', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const keep = world.buildings.find(
      (b) => b.team === 'player' && b.typeId === 'junkyard',
    )!;
    keep.complete = true;
    keep.buildProgress = 1;

    const armed = buildSelectionView(
      world,
      keep,
      [],
      false,
      false,
      null,
      'bonker_hut',
    );
    expect(armed.kind).toBe('building');
    if (armed.kind === 'building') {
      const hut = armed.places.find((p) => p.typeId === 'bonker_hut');
      expect(hut?.armed).toBe(true);
      expect(armed.places.filter((p) => p.armed)).toHaveLength(1);
    }

    const fake = { ...keep, typeId: 'bonker_hut' as const, name: 'Bonker Hut' };
    const nonHall = buildSelectionView(world, fake, [], false);
    expect(nonHall.kind).toBe('building');
    if (nonHall.kind === 'building') {
      expect(nonHall.places).toEqual([]);
    }
  });
});
