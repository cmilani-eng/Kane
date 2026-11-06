import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from './battlefieldWorld';
import {
  listIdleMilitary,
  nearestIdleArmyThreatArrow,
} from './idleMilitary';

describe('nearestIdleArmyThreatArrow', () => {
  it('returns an 8-way arrow toward the nearest living enemy', () => {
    const world = createBattlefieldWorld('brutes', 'practice');
    const idles = listIdleMilitary(world);
    expect(idles.length).toBeGreaterThan(0);
    const enemy = world.units.find((u) => u.team === 'enemy' && u.hp > 0);
    expect(enemy).toBeTruthy();

    // Park idle army far west; enemy far east → eastward tip.
    for (const u of idles) {
      u.x = 100;
      u.y = 500;
    }
    enemy!.x = 900;
    enemy!.y = 500;
    for (const u of world.units) {
      if (u.team === 'enemy' && u.id !== enemy!.id) u.hp = 0;
    }

    expect(nearestIdleArmyThreatArrow(world)).toBe('→');
  });

  it('returns null when no idle military remains', () => {
    const world = createBattlefieldWorld('brutes', 'practice');
    for (const u of listIdleMilitary(world)) {
      u.moveTarget = { x: u.x + 10, y: u.y };
    }
    expect(nearestIdleArmyThreatArrow(world)).toBeNull();
  });
});
