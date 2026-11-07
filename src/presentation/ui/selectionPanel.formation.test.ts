import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { getUnitType } from '../../data/units';
import { buildSelectionView } from './selectionPanel';

describe('Nobles formation selection controls', () => {
  it('exposes formation stance on formation-capable Nobles', () => {
    const world = createBattlefieldWorld('nobles', 'normal');
    const units = world.units.filter(
      (u) =>
        u.team === 'player' &&
        u.hp > 0 &&
        getUnitType(u.typeId).usesFormation,
    );
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) {
      u.selected = true;
      u.formationLocked = false;
      u.inFormation = true;
    }

    const view = buildSelectionView(world, null, units, false);
    expect(view.kind).toBe('units');
    if (view.kind !== 'units') return;
    expect(view.formation).not.toBeNull();
    expect(view.formation!.eligible).toBe(units.length);
    expect(view.formation!.formed).toBe(units.length);
    expect(view.formation!.allLocked).toBe(false);
    expect(view.controlHint).toContain('F');
    expect(view.controlHint).toMatch(
      new RegExp(`${units.length}/${units.length}`),
    );

    for (const u of units) u.formationLocked = true;
    const locked = buildSelectionView(world, null, units, false);
    expect(locked.kind).toBe('units');
    if (locked.kind === 'units') {
      expect(locked.formation?.allLocked).toBe(true);
      expect(locked.formation?.locked).toBe(units.length);
    }
  });

  it('shows a formation count tip when only some Nobles are formed', () => {
    const world = createBattlefieldWorld('nobles', 'normal');
    const units = world.units.filter(
      (u) =>
        u.team === 'player' &&
        u.hp > 0 &&
        getUnitType(u.typeId).usesFormation,
    );
    expect(units.length).toBeGreaterThan(1);
    for (const u of units) {
      u.selected = true;
      u.formationLocked = false;
      u.inFormation = false;
    }
    units[0]!.inFormation = true;

    const view = buildSelectionView(world, null, units, false);
    expect(view.kind).toBe('units');
    if (view.kind !== 'units') return;
    expect(view.controlHint).toContain('1/');
    expect(view.controlHint).toContain(String(units.length));
  });

  it('hides formation controls for Brutes', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const units = world.units.filter((u) => u.team === 'player' && u.hp > 0);
    const view = buildSelectionView(world, null, units, false);
    expect(view.kind).toBe('units');
    if (view.kind === 'units') {
      expect(view.formation).toBeNull();
    }
  });
});
