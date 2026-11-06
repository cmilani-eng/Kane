import { describe, expect, it } from 'vitest';
import {
  groupCenter,
  isGroupDoubleTap,
  GROUP_DOUBLE_TAP_MS,
} from './battlefieldGroupFocus';
import {
  assignControlGroup,
  createControlGroups,
  recallControlGroup,
} from './battlefieldOrders';
import {
  clearSelection,
  createBattlefieldWorld,
  selectedUnits,
  type BattlefieldWorld,
} from './battlefieldWorld';

const army = (w: BattlefieldWorld) =>
  w.units.filter((u) => u.team === 'player' && !u.canGather);

describe('isGroupDoubleTap', () => {
  it('needs the same slot inside the window', () => {
    const prev = { slot: 3, time: 1000 };

    expect(isGroupDoubleTap(null, 3, 1100)).toBe(false);
    expect(isGroupDoubleTap(prev, 3, 1000 + GROUP_DOUBLE_TAP_MS)).toBe(true);
    expect(isGroupDoubleTap(prev, 4, 1100)).toBe(false);
    expect(isGroupDoubleTap(prev, 3, 1001 + GROUP_DOUBLE_TAP_MS)).toBe(false);
  });
});

describe('groupCenter', () => {
  it('is the middle of the living members', () => {
    const w = createBattlefieldWorld('brutes');
    const [a, b, dead] = army(w);
    a!.x = 100;
    a!.y = 200;
    b!.x = 300;
    b!.y = 400;
    dead!.hp = 0;

    expect(groupCenter(w, [a!.id, b!.id, dead!.id])).toEqual({ x: 200, y: 300 });
  });

  it('ignores enemies and unknown ids, and is null when nobody is left', () => {
    const w = createBattlefieldWorld('brutes');
    const enemy = w.units.find((u) => u.team === 'enemy')!;

    expect(groupCenter(w, [enemy.id, -1])).toBeNull();
    expect(groupCenter(w, [])).toBeNull();
  });
});

describe('control group round trip', () => {
  it('recalls the saved units and centres on them', () => {
    const w = createBattlefieldWorld('brutes');
    const groups = createControlGroups();
    const saved = army(w).slice(0, 2);
    saved[0]!.x = 500;
    saved[0]!.y = 600;
    saved[1]!.x = 700;
    saved[1]!.y = 800;

    clearSelection(w);
    saved.forEach((u) => (u.selected = true));
    expect(assignControlGroup(w, groups, 4)).toBe(true);

    clearSelection(w);
    expect(recallControlGroup(w, groups, 4)).toBe(2);
    expect(
      selectedUnits(w)
        .map((u) => u.id)
        .sort(),
    ).toEqual(saved.map((u) => u.id).sort());
    expect(groupCenter(w, groups.get(4)!)).toEqual({ x: 600, y: 700 });
  });
});
