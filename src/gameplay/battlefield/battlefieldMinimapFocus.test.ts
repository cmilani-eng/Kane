import { describe, expect, it } from 'vitest';
import { selectionOrOrderFocus } from './battlefieldMinimapFocus';
import { spawnWaypointMarker } from './battlefieldWaypointMarkers';
import {
  clearSelection,
  createBattlefieldWorld,
} from './battlefieldWorld';

describe('selectionOrOrderFocus', () => {
  it('returns the centroid of selected living units', () => {
    const w = createBattlefieldWorld('brutes', 'normal');
    clearSelection(w);
    const army = w.units.filter(
      (u) => u.team === 'player' && !u.canGather && u.hp > 0,
    );
    expect(army.length).toBeGreaterThan(0);
    for (const u of army) u.selected = true;
    const focus = selectionOrOrderFocus(w, null);
    expect(focus).not.toBeNull();
    const xs = army.map((u) => u.x);
    const ys = army.map((u) => u.y);
    expect(focus!.x).toBeCloseTo(xs.reduce((a, b) => a + b, 0) / xs.length);
    expect(focus!.y).toBeCloseTo(ys.reduce((a, b) => a + b, 0) / ys.length);
  });

  it('falls back to selected building, then last order ping', () => {
    const w = createBattlefieldWorld('brutes', 'normal');
    clearSelection(w);
    const hall = w.buildings.find(
      (b) => b.team === 'player' && b.hp > 0,
    )!;
    expect(selectionOrOrderFocus(w, hall)).toEqual({ x: hall.x, y: hall.y });

    clearSelection(w);
    const ids = w.units
      .filter((u) => u.team === 'player' && u.hp > 0)
      .map((u) => u.id)
      .slice(0, 2);
    spawnWaypointMarker(w, 900, 400, 'move', ids);
    spawnWaypointMarker(w, 1100, 500, 'attackMove', ids);
    const ping = selectionOrOrderFocus(w, null);
    expect(ping).toEqual({ x: 1100, y: 500 });
  });

  it('returns null when nothing is focused', () => {
    const w = createBattlefieldWorld('brutes', 'normal');
    clearSelection(w);
    w.waypointMarkers = [];
    expect(selectionOrOrderFocus(w, null)).toBeNull();
  });
});
