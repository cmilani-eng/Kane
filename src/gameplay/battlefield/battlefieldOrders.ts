/**
 * Control groups + stop / attack-move orders.
 */
import { MAP } from '../../config/balance';
import { clamp } from '../math';
import { clearUnitPath, setUnitPath } from './battlefieldPathfinding';
import { spawnWaypointMarker } from './battlefieldWaypointMarkers';
import type { BattlefieldWorld } from './battlefieldWorld';
import {
  clearSelection,
  isLivingPlayerUnit,
  selectedUnits,
} from './battlefieldWorld';

export type ControlGroups = Map<number, number[]>;

export function createControlGroups(): ControlGroups {
  return new Map();
}

/**
 * Ctrl+N — save selected player units into group 0–9.
 * An empty selection is a no-op, so a stray chord never wipes a saved group.
 */
export function assignControlGroup(
  world: BattlefieldWorld,
  groups: ControlGroups,
  slot: number,
): boolean {
  if (slot < 0 || slot > 9) return false;
  const ids = selectedUnits(world).map((u) => u.id);
  if (ids.length === 0) return false;
  groups.set(slot, ids);
  return true;
}

/**
 * Shift+Ctrl+N — add the selected player units to group 0–9, keeping the
 * units already in it. An empty selection is a no-op.
 */
export function addToControlGroup(
  world: BattlefieldWorld,
  groups: ControlGroups,
  slot: number,
): boolean {
  if (slot < 0 || slot > 9) return false;
  const ids = selectedUnits(world).map((u) => u.id);
  if (ids.length === 0) return false;
  groups.set(slot, [...new Set([...(groups.get(slot) ?? []), ...ids])]);
  return true;
}

/** N — select living members of group (additive with Shift). */
export function recallControlGroup(
  world: BattlefieldWorld,
  groups: ControlGroups,
  slot: number,
  additive = false,
): number {
  const ids = groups.get(slot);
  if (!ids || ids.length === 0) return 0;
  const living = new Set(
    world.units.filter(isLivingPlayerUnit).map((u) => u.id),
  );
  const valid = ids.filter((id) => living.has(id));
  groups.set(slot, valid);
  if (valid.length === 0) return 0;
  if (!additive) clearSelection(world);
  let n = 0;
  for (const u of world.units) {
    if (u.team !== 'player') continue;
    if (valid.includes(u.id)) {
      u.selected = true;
      n++;
    }
  }
  return n;
}

/** S — halt selected units. */
export function stopSelected(world: BattlefieldWorld): number {
  let n = 0;
  for (const u of selectedUnits(world)) {
    clearUnitPath(u);
    u.attackTargetId = null;
    u.gatherNodeId = null;
    u.attackMove = false;
    n++;
  }
  return n;
}

/**
 * A-click — march to point but auto-engage enemies along the way.
 * Sets `attackMove` so combat may acquire while pathing.
 */
export function issueAttackMoveSelected(
  world: BattlefieldWorld,
  x: number,
  y: number,
): number {
  const selected = selectedUnits(world);
  if (selected.length === 0) return 0;
  const gx = clamp(x, 20, MAP.width - 20);
  const gy = clamp(y, 20, MAP.height - 20);
  selected.forEach((u, i) => {
    u.gatherNodeId = null;
    u.attackTargetId = null;
    u.attackMove = true;
    const ox = (i % 5) * 28 - 56;
    const oy = Math.floor(i / 5) * 28;
    setUnitPath(world, u, {
      x: clamp(gx + ox, 20, MAP.width - 20),
      y: clamp(gy + oy, 20, MAP.height - 20),
    });
  });
  spawnWaypointMarker(
    world,
    gx,
    gy,
    'attackMove',
    selected.map((u) => u.id),
  );
  return selected.length;
}
