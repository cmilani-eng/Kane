/**
 * Double-tapping a control-group key centres the camera on that group.
 * Pure helpers (no Phaser) so the timing and maths are unit-tested.
 */
import type { BattlefieldWorld } from './battlefieldWorld';

export const GROUP_DOUBLE_TAP_MS = 350;

export interface GroupTap {
  slot: number;
  time: number;
}

/** The same group key pressed twice in quick succession. */
export function isGroupDoubleTap(
  prev: GroupTap | null,
  slot: number,
  time: number,
): boolean {
  return (
    prev !== null &&
    prev.slot === slot &&
    time - prev.time <= GROUP_DOUBLE_TAP_MS
  );
}

/** The middle of the living player units in `ids`, or null if none are left. */
export function groupCenter(
  world: BattlefieldWorld,
  ids: readonly number[],
): { x: number; y: number } | null {
  const wanted = new Set(ids);
  const members = world.units.filter(
    (u) => u.team === 'player' && u.hp > 0 && wanted.has(u.id),
  );
  if (members.length === 0) return null;
  return {
    x: members.reduce((sum, u) => sum + u.x, 0) / members.length,
    y: members.reduce((sum, u) => sum + u.y, 0) / members.length,
  };
}
