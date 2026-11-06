import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { getUnitType } from '../../data/units';
import { buildSelectionView } from './selectionPanel';

describe('Weirdos mutation selection controls', () => {
  it('exposes mutation role lock on mutate-capable Weirdos', () => {
    const world = createBattlefieldWorld('weirdos', 'normal');
    const units = world.units.filter(
      (u) =>
        u.team === 'player' &&
        u.hp > 0 &&
        getUnitType(u.typeId).canMutate,
    );
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) {
      u.selected = true;
      u.mutationLocked = false;
      u.mutated = true;
    }

    const view = buildSelectionView(world, null, units, false);
    expect(view.kind).toBe('units');
    if (view.kind !== 'units') return;
    expect(view.mutation).not.toBeNull();
    expect(view.mutation!.eligible).toBe(units.length);
    expect(view.mutation!.mutated).toBe(units.length);
    expect(view.mutation!.allLocked).toBe(false);
    expect(view.formation).toBeNull();
    expect(view.rage).toBeNull();

    for (const u of units) u.mutationLocked = true;
    const locked = buildSelectionView(world, null, units, false);
    expect(locked.kind).toBe('units');
    if (locked.kind === 'units') {
      expect(locked.mutation?.allLocked).toBe(true);
      expect(locked.mutation?.locked).toBe(units.length);
    }
  });

  it('hides mutation controls for Brutes', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const units = world.units.filter((u) => u.team === 'player' && u.hp > 0);
    const view = buildSelectionView(world, null, units, false);
    expect(view.kind).toBe('units');
    if (view.kind === 'units') {
      expect(view.mutation).toBeNull();
    }
  });
});
