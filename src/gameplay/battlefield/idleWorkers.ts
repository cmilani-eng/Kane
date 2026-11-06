/**
 * Idle worker detection — empty-handed or holding resources, standing still.
 * Presentation uses this for subtle HUD / minimap attention pings.
 */
import type {
  BattlefieldUnit,
  BattlefieldWorld,
} from './battlefieldWorld';
import { clearSelection } from './battlefieldWorld';

/** Player gatherer with nothing to do right now. */
export function isIdleWorker(u: BattlefieldUnit): boolean {
  if (u.team !== 'player' || !u.canGather || u.hp <= 0) return false;
  if (u.attackTargetId != null) return false;
  if (u.gatherNodeId != null) return false;
  if (u.moveTarget != null || u.path.length > 0) return false;
  // Empty OR holding cargo (stuck before deposit) both deserve attention.
  return true;
}

export function listIdleWorkers(world: BattlefieldWorld): BattlefieldUnit[] {
  return world.units.filter(isIdleWorker);
}

export function countIdleWorkers(world: BattlefieldWorld): number {
  let n = 0;
  for (const u of world.units) {
    if (isIdleWorker(u)) n++;
  }
  return n;
}

/** Select all idle workers (HUD ping affordance). */
export function selectIdleWorkers(world: BattlefieldWorld): number {
  const idles = listIdleWorkers(world);
  if (idles.length === 0) return 0;
  clearSelection(world);
  for (const u of idles) u.selected = true;
  return idles.length;
}
