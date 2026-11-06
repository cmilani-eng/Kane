import { describe, expect, it } from 'vitest';
import { stepSubgroup, type SubgroupCycle } from './battlefieldSubgroups';
import {
  clearSelection,
  createBattlefieldWorld,
  selectedUnits,
  type BattlefieldUnit,
  type BattlefieldWorld,
} from './battlefieldWorld';

/** Two living player units of each of two different types, plus their ids. */
function mixedSelection(w: BattlefieldWorld) {
  const player = w.units.filter((u) => u.team === 'player' && u.hp > 0);
  const typeA = player[0]!.typeId;
  const typeB = player.find((u) => u.typeId !== typeA)!.typeId;
  const as = player.filter((u) => u.typeId === typeA).slice(0, 2);
  const bs = player.filter((u) => u.typeId === typeB).slice(0, 2);
  return { typeA, typeB, as, bs, all: [...as, ...bs] };
}

function select(w: BattlefieldWorld, units: BattlefieldUnit[]): void {
  clearSelection(w);
  units.forEach((u) => (u.selected = true));
}

/** Applies a step the way the scene does and returns the new cycle. */
function apply(
  w: BattlefieldWorld,
  cycle: SubgroupCycle | null,
  dir: 1 | -1 = 1,
): { cycle: SubgroupCycle; ids: number[] } {
  const step = stepSubgroup(w, cycle, dir);
  expect(step).not.toBeNull();
  const wanted = new Set(step!.ids);
  for (const u of w.units) u.selected = wanted.has(u.id);
  return step!;
}

const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b);

describe('stepSubgroup', () => {
  it('does nothing when the selection has one unit type or none', () => {
    const w = createBattlefieldWorld('brutes');
    const { as, all } = mixedSelection(w);

    select(w, as);
    expect(stepSubgroup(w, null, 1)).toBeNull();
    clearSelection(w);
    expect(stepSubgroup(w, null, 1)).toBeNull();
    expect(all.length).toBeGreaterThan(as.length);
  });

  it('walks every type, each type alone, then back to every type', () => {
    const w = createBattlefieldWorld('brutes');
    const { as, bs, all } = mixedSelection(w);
    select(w, all);

    const first = apply(w, null);
    expect(sorted(first.ids)).toEqual(sorted(as.map((u) => u.id)));
    const second = apply(w, first.cycle);
    expect(sorted(second.ids)).toEqual(sorted(bs.map((u) => u.id)));
    const third = apply(w, second.cycle);
    expect(sorted(third.ids)).toEqual(sorted(all.map((u) => u.id)));
    expect(sorted(selectedUnits(w).map((u) => u.id))).toEqual(
      sorted(all.map((u) => u.id)),
    );
  });

  it('goes backwards with Shift+Tab, starting from the last type', () => {
    const w = createBattlefieldWorld('brutes');
    const { bs, all } = mixedSelection(w);
    select(w, all);

    const back = apply(w, null, -1);
    expect(sorted(back.ids)).toEqual(sorted(bs.map((u) => u.id)));
  });

  it('starts a new cycle when the selection was changed in between', () => {
    const w = createBattlefieldWorld('brutes');
    const { as, bs, all } = mixedSelection(w);
    select(w, all);
    const first = apply(w, null);

    // The player picks a different pair; the old cycle must not be resumed.
    select(w, [as[0]!, bs[0]!]);
    const next = apply(w, first.cycle);
    expect(sorted([...next.cycle.base])).toEqual(
      sorted([as[0]!.id, bs[0]!.id]),
    );
    expect(next.ids).toEqual([as[0]!.id]);
  });

  it('skips a type whose units have all died', () => {
    const w = createBattlefieldWorld('brutes');
    const { as, bs, all } = mixedSelection(w);
    select(w, all);
    const first = apply(w, null);
    expect(sorted(first.ids)).toEqual(sorted(as.map((u) => u.id)));

    bs.forEach((u) => (u.hp = 0));
    select(w, as);
    // Only type A is left, so the ring has nothing else to show.
    expect(stepSubgroup(w, first.cycle, 1)).toBeNull();
  });

  it('ignores enemies and dead units that are flagged as selected', () => {
    const w = createBattlefieldWorld('brutes');
    const { as, bs, all } = mixedSelection(w);
    const enemy = w.units.find((u) => u.team === 'enemy')!;
    select(w, all);
    enemy.selected = true;
    bs[1]!.hp = 0;

    const step = stepSubgroup(w, null, 1)!;
    expect(step.cycle.base).not.toContain(enemy.id);
    expect(step.cycle.base).not.toContain(bs[1]!.id);
    expect(sorted(step.ids)).toEqual(sorted(as.map((u) => u.id)));
  });
});
