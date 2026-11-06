import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld, spawnUnit } from '../../gameplay/battlefield/battlefieldWorld';
import { buildSelectionView } from './selectionPanel';

describe('Weirdos Grabber / hero control hint', () => {
  it('shows a Grabber control hint when Grabber is selected', () => {
    const world = createBattlefieldWorld('weirdos', 'normal');
    const grabber = spawnUnit(world, {
      team: 'player',
      typeId: 'grabber',
      x: 80,
      y: 80,
      color: 0x7a4aa8,
    });
    grabber.selected = true;

    const view = buildSelectionView(world, null, [grabber], false);
    expect(view.kind).toBe('units');
    if (view.kind !== 'units') return;
    expect(view.controlHint).toMatch(/Grabber/i);
    expect(view.controlHint).toMatch(/Mutation/i);
  });

  it('shows a ZOGGLE control hint for the Weirdos hero', () => {
    const world = createBattlefieldWorld('weirdos', 'normal');
    const hero = spawnUnit(world, {
      team: 'player',
      typeId: 'zoggle',
      x: 100,
      y: 100,
      color: 0x6ecfbf,
    });
    hero.selected = true;

    const view = buildSelectionView(world, null, [hero], false);
    expect(view.kind).toBe('units');
    if (view.kind !== 'units') return;
    expect(view.controlHint).toMatch(/ZOGGLE/i);
    expect(view.controlHint).toMatch(/Q/);
  });

  it('omits the hint for ordinary bloblets', () => {
    const world = createBattlefieldWorld('weirdos', 'normal');
    const units = world.units.filter(
      (u) => u.team === 'player' && u.typeId === 'bloblet' && u.hp > 0,
    );
    // Seed army may not include bloblet — spawn one.
    const blob =
      units[0] ??
      spawnUnit(world, {
        team: 'player',
        typeId: 'bloblet',
        x: 60,
        y: 60,
        color: 0x7a4aa8,
      });
    blob.selected = true;
    const view = buildSelectionView(world, null, [blob], false);
    expect(view.kind).toBe('units');
    if (view.kind === 'units') {
      expect(view.controlHint).toBeNull();
    }
  });
});
