/**
 * Idle worker detection — empty-handed or holding resources, standing still.
 * Presentation uses this for subtle HUD / minimap attention pings.
 */
import type { ResourceId } from '../../data/resources';
import type {
  BattlefieldUnit,
  BattlefieldWorld,
} from './battlefieldWorld';
import { clearSelection } from './battlefieldWorld';

/** Living player gatherer (busy or idle). */
export function isLivingWorker(u: BattlefieldUnit): boolean {
  return u.team === 'player' && u.canGather && u.hp > 0;
}

/** Player gatherer with nothing to do right now. */
export function isIdleWorker(u: BattlefieldUnit): boolean {
  if (!isLivingWorker(u)) return false;
  if (u.attackTargetId != null) return false;
  if (u.gatherNodeId != null) return false;
  if (u.moveTarget != null || u.path.length > 0) return false;
  // Empty OR holding cargo (stuck before deposit) both deserve attention.
  return true;
}

export function listIdleWorkers(world: BattlefieldWorld): BattlefieldUnit[] {
  return world.units.filter(isIdleWorker).sort((a, b) => a.id - b.id);
}

export function countLivingWorkers(world: BattlefieldWorld): number {
  let n = 0;
  for (const u of world.units) {
    if (isLivingWorker(u)) n++;
  }
  return n;
}

export function countIdleWorkers(world: BattlefieldWorld): number {
  let n = 0;
  for (const u of world.units) {
    if (isIdleWorker(u)) n++;
  }
  return n;
}

/**
 * Nearest remaining resource type for empty-handed idle workers.
 * Used by the idle chip to hint a gather target (Gold vs Crystals).
 */
export function nearestIdleGatherResource(
  world: BattlefieldWorld,
): ResourceId | null {
  const idles = listIdleWorkers(world).filter((u) => u.carrying <= 0);
  if (idles.length === 0) return null;
  let best: { id: ResourceId; d2: number } | null = null;
  for (const u of idles) {
    for (const n of world.nodes) {
      if (n.remaining <= 0) continue;
      const dx = n.x - u.x;
      const dy = n.y - u.y;
      const d2 = dx * dx + dy * dy;
      if (!best || d2 < best.d2) best = { id: n.resourceId, d2 };
    }
  }
  return best?.id ?? null;
}

/** Select all idle workers (HUD ping affordance). */
export function selectIdleWorkers(world: BattlefieldWorld): number {
  const idles = listIdleWorkers(world);
  if (idles.length === 0) return 0;
  clearSelection(world);
  for (const u of idles) u.selected = true;
  return idles.length;
}

export type IdleChipResult = {
  count: number;
  mode: 'all' | 'cycle';
  /** Focus unit for camera (first of all, or the cycled one). */
  focus: BattlefieldUnit | null;
};

/**
 * Idle chip: first tap selects all idle workers; further taps cycle one-by-one.
 */
export function selectOrCycleIdleWorkers(world: BattlefieldWorld): IdleChipResult {
  const idles = listIdleWorkers(world);
  if (idles.length === 0) {
    return { count: 0, mode: 'all', focus: null };
  }

  const anyIdleSelected = idles.some((u) => u.selected);
  if (!anyIdleSelected) {
    clearSelection(world);
    for (const u of idles) u.selected = true;
    return { count: idles.length, mode: 'all', focus: idles[0] ?? null };
  }

  let last = -1;
  for (let i = 0; i < idles.length; i++) {
    if (idles[i]!.selected) last = i;
  }
  const next = idles[(last + 1) % idles.length]!;
  clearSelection(world);
  next.selected = true;
  return { count: 1, mode: 'cycle', focus: next };
}
