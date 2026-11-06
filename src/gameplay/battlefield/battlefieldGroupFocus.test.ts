import { describe, expect, it } from 'vitest';
import {
  groupCenter,
  GroupTapTracker,
  isGroupDoubleTap,
  shouldCountGroupHotkey,
  GROUP_DOUBLE_TAP_MS,
} from './battlefieldGroupFocus';
import {
  addToControlGroup,
  assignControlGroup,
  createControlGroups,
  recallControlGroup,
} from './battlefieldOrders';
import { isMilitaryUnit } from './selectMilitary';
import {
  clearSelection,
  createBattlefieldWorld,
  selectedUnits,
} from './battlefieldWorld';

describe('shouldCountGroupHotkey', () => {
  it('counts the initial keydown and ignores auto-repeat', () => {
    expect(shouldCountGroupHotkey(false)).toBe(true);
    expect(shouldCountGroupHotkey(true)).toBe(false);
  });
});

describe('isGroupDoubleTap', () => {
  it('needs the same slot inside the window', () => {
    const prev = { slot: 3, time: 1000 };

    expect(isGroupDoubleTap(null, 3, 1100)).toBe(false);
    expect(isGroupDoubleTap(prev, 3, 1000 + GROUP_DOUBLE_TAP_MS)).toBe(true);
    expect(isGroupDoubleTap(prev, 4, 1100)).toBe(false);
    expect(isGroupDoubleTap(prev, 3, 1001 + GROUP_DOUBLE_TAP_MS)).toBe(false);
  });
});

describe('GroupTapTracker', () => {
  it('reports the second quick press on the same slot', () => {
    const taps = new GroupTapTracker();

    expect(taps.press(2, 1000)).toBe(false);
    expect(taps.press(2, 1100)).toBe(true);
  });

  it('does not chain across different slots or a slow press', () => {
    const taps = new GroupTapTracker();

    taps.press(2, 1000);
    expect(taps.press(3, 1100)).toBe(false);
    expect(taps.press(3, 1100 + GROUP_DOUBLE_TAP_MS + 1)).toBe(false);
  });

  it('forgets the last press after reset (assign, train, empty slot)', () => {
    const taps = new GroupTapTracker();

    taps.press(2, 1000);
    taps.reset();
    expect(taps.press(2, 1100)).toBe(false);
  });
});

describe('groupCenter', () => {
  it('is the middle of the living members', () => {
    const w = createBattlefieldWorld('brutes');
    const [a, b, dead] = w.units.filter(isMilitaryUnit);
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
    const saved = w.units.filter(isMilitaryUnit).slice(0, 2);
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

  it('keeps a saved group when assigning with nothing selected', () => {
    const w = createBattlefieldWorld('brutes');
    const groups = createControlGroups();
    const saved = w.units.filter(isMilitaryUnit).slice(0, 2);

    clearSelection(w);
    saved.forEach((u) => (u.selected = true));
    assignControlGroup(w, groups, 3);

    clearSelection(w);
    expect(assignControlGroup(w, groups, 3)).toBe(false);
    expect(groups.get(3)).toEqual(saved.map((u) => u.id));
  });
});

describe('addToControlGroup', () => {
  const pick = (w: ReturnType<typeof createBattlefieldWorld>, from: number, n: number) =>
    w.units.filter(isMilitaryUnit).slice(from, from + n);
  const select = (w: ReturnType<typeof createBattlefieldWorld>, units: { selected: boolean }[]) => {
    clearSelection(w);
    units.forEach((u) => (u.selected = true));
  };

  it('keeps the units already in the group and adds the selection', () => {
    const w = createBattlefieldWorld('brutes');
    const groups = createControlGroups();
    const first = pick(w, 0, 2);
    const more = pick(w, 2, 2);

    select(w, first);
    assignControlGroup(w, groups, 5);
    select(w, more);

    expect(addToControlGroup(w, groups, 5)).toBe(true);
    expect(groups.get(5)).toEqual([...first, ...more].map((u) => u.id));
  });

  it('does not list a unit twice', () => {
    const w = createBattlefieldWorld('brutes');
    const groups = createControlGroups();
    const units = pick(w, 0, 3);

    select(w, units.slice(0, 2));
    assignControlGroup(w, groups, 2);
    select(w, units.slice(1, 3));
    addToControlGroup(w, groups, 2);

    expect(groups.get(2)).toEqual(units.map((u) => u.id));
  });

  it('starts a group when the slot is empty', () => {
    const w = createBattlefieldWorld('brutes');
    const groups = createControlGroups();
    const units = pick(w, 0, 2);

    select(w, units);
    expect(addToControlGroup(w, groups, 7)).toBe(true);
    expect(groups.get(7)).toEqual(units.map((u) => u.id));
  });

  it('does nothing with an empty selection or a bad slot', () => {
    const w = createBattlefieldWorld('brutes');
    const groups = createControlGroups();
    const units = pick(w, 0, 2);

    select(w, units);
    assignControlGroup(w, groups, 1);
    clearSelection(w);

    expect(addToControlGroup(w, groups, 1)).toBe(false);
    expect(groups.get(1)).toEqual(units.map((u) => u.id));
    select(w, units);
    expect(addToControlGroup(w, groups, 10)).toBe(false);
    expect(addToControlGroup(w, groups, -1)).toBe(false);
  });
});
