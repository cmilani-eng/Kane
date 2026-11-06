import { describe, expect, it } from 'vitest';
import {
  countIdleMilitary,
  isIdleMilitary,
  selectOrCycleIdleMilitary,
} from './idleMilitary';
import { createBattlefieldWorld } from './battlefieldWorld';
import { isMilitaryUnit } from './selectMilitary';

describe('idle military', () => {
  it('treats standing combat units as idle and ignores workers', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const mil = world.units.filter(isMilitaryUnit);
    expect(mil.length).toBeGreaterThan(0);
    for (const u of mil) {
      u.moveTarget = null;
      u.path = [];
      u.attackTargetId = null;
      expect(isIdleMilitary(u)).toBe(true);
    }
    const workers = world.units.filter((u) => u.canGather && u.hp > 0);
    expect(workers.length).toBeGreaterThan(0);
    expect(workers.every((u) => !isIdleMilitary(u))).toBe(true);
    expect(countIdleMilitary(world)).toBe(mil.length);
  });

  it('first tap selects all idle; further taps cycle one and focus', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const mil = world.units.filter(isMilitaryUnit);
    for (const u of mil) {
      u.moveTarget = null;
      u.path = [];
      u.attackTargetId = null;
      u.selected = false;
    }
    expect(mil.length).toBeGreaterThan(1);

    const all = selectOrCycleIdleMilitary(world);
    expect(all.mode).toBe('all');
    expect(all.count).toBe(mil.length);
    expect(all.focus?.id).toBe(mil.sort((a, b) => a.id - b.id)[0]!.id);
    expect(mil.every((u) => u.selected)).toBe(true);

    const cycled = selectOrCycleIdleMilitary(world);
    expect(cycled.mode).toBe('cycle');
    expect(cycled.count).toBe(1);
    expect(cycled.focus).not.toBeNull();
    expect(world.units.filter((u) => u.selected)).toHaveLength(1);
    expect(cycled.focus!.selected).toBe(true);
  });

  it('excludes units that are moving or attacking', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const u = world.units.find(isMilitaryUnit)!;
    u.moveTarget = { x: 10, y: 10 };
    u.path = [];
    u.attackTargetId = null;
    expect(isIdleMilitary(u)).toBe(false);
    u.moveTarget = null;
    u.attackTargetId = 99;
    expect(isIdleMilitary(u)).toBe(false);
  });
});
