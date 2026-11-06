/**
 * Double-tapping a control-group key centres the camera on that group.
 * Pure helpers (no Phaser) so the timing and maths are unit-tested.
 */
import { isLivingPlayerUnit, type BattlefieldWorld } from './battlefieldWorld';

export const GROUP_DOUBLE_TAP_MS = 350;

/**
 * Held number keys auto-repeat. Only the first keydown should recall a
 * group or centre the camera; repeats must be ignored.
 */
export function shouldCountGroupHotkey(repeat: boolean): boolean {
  return !repeat;
}

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

/**
 * Remembers the last group-key press. Anything that is not a group recall
 * (assigning, training, an empty slot, a new match) must call `reset`.
 */
export class GroupTapTracker {
  private last: GroupTap | null = null;

  /** Records this press; true when it completes a double-tap on `slot`. */
  press(slot: number, time: number): boolean {
    const double = isGroupDoubleTap(this.last, slot, time);
    this.last = { slot, time };
    return double;
  }

  reset(): void {
    this.last = null;
  }
}

/** The middle of the living player units in `ids`, or null if none are left. */
export function groupCenter(
  world: BattlefieldWorld,
  ids: readonly number[],
): { x: number; y: number } | null {
  const wanted = new Set(ids);
  const members = world.units.filter(
    (u) => isLivingPlayerUnit(u) && wanted.has(u.id),
  );
  if (members.length === 0) return null;
  return {
    x: members.reduce((sum, u) => sum + u.x, 0) / members.length,
    y: members.reduce((sum, u) => sum + u.y, 0) / members.length,
  };
}
