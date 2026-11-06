import { describe, expect, it } from 'vitest';
import { RAGE } from '../../gameplay/battlefield/battlefieldRage';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { getUnitType } from '../../data/units';
import { buildSelectionView } from './selectionPanel';

describe('Brutes Rage selection controls', () => {
  it('exposes rage meter + lock on rage-capable Brutes', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const units = world.units.filter(
      (u) =>
        u.team === 'player' && u.hp > 0 && getUnitType(u.typeId).canRage,
    );
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) {
      u.selected = true;
      u.rageLocked = false;
      u.enraged = true;
      u.rageCombatMs = RAGE.lingerMs * 0.5;
    }

    const view = buildSelectionView(world, null, units, false);
    expect(view.kind).toBe('units');
    if (view.kind !== 'units') return;
    expect(view.rage).not.toBeNull();
    expect(view.rage!.eligible).toBe(units.length);
    expect(view.rage!.meter).toBeCloseTo(0.5, 5);
    expect(view.rage!.allLocked).toBe(false);
    expect(view.formation).toBeNull();

    for (const u of units) {
      u.rageLocked = true;
      u.enraged = true;
    }
    const locked = buildSelectionView(world, null, units, false);
    expect(locked.kind).toBe('units');
    if (locked.kind === 'units') {
      expect(locked.rage?.allLocked).toBe(true);
      expect(locked.rage?.meter).toBe(1);
    }
  });

  it('hides rage controls for Nobles', () => {
    const world = createBattlefieldWorld('nobles', 'normal');
    const units = world.units.filter((u) => u.team === 'player' && u.hp > 0);
    const view = buildSelectionView(world, null, units, false);
    expect(view.kind).toBe('units');
    if (view.kind === 'units') {
      expect(view.rage).toBeNull();
    }
  });
});
