/**
 * Tab cycles through the unit types in the current selection: every type
 * together, then each type on its own, then back to every type. Shift+Tab
 * walks the same ring backwards. Pure (no Phaser) so the stepping is unit-tested.
 */
import type { UnitTypeId } from '../../data/units';
import {
  isLivingPlayerUnit,
  selectedUnits,
  type BattlefieldWorld,
} from './battlefieldWorld';

export interface SubgroupCycle {
  /** Unit ids that were selected when the cycle started. */
  base: readonly number[];
  /** Distinct unit types in `base`, in order of first appearance. */
  types: readonly UnitTypeId[];
  /** -1 selects every type; otherwise an index into `types`. */
  step: number;
}

export interface SubgroupStep {
  cycle: SubgroupCycle;
  /** Unit ids to select now. */
  ids: number[];
}

/** The units of the cycle's base that are still alive. */
function livingBase(world: BattlefieldWorld, cycle: SubgroupCycle) {
  const base = new Set(cycle.base);
  return world.units.filter((u) => isLivingPlayerUnit(u) && base.has(u.id));
}

/** The living base units the cycle shows at its current step. */
function idsAtStep(world: BattlefieldWorld, cycle: SubgroupCycle): number[] {
  return livingBase(world, cycle)
    .filter((u) => cycle.step < 0 || u.typeId === cycle.types[cycle.step])
    .map((u) => u.id);
}

function sameIds(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

/**
 * Moves one step round the ring. The cycle continues while the selection is
 * still what the last step produced; any other selection starts a new cycle.
 * Returns null when the selection has fewer than two unit types.
 */
export function stepSubgroup(
  world: BattlefieldWorld,
  prev: SubgroupCycle | null,
  dir: 1 | -1,
): SubgroupStep | null {
  const current = selectedUnits(world).filter(isLivingPlayerUnit);
  const currentIds = current.map((u) => u.id);
  const cycle: SubgroupCycle =
    prev && sameIds(currentIds, idsAtStep(world, prev))
      ? prev
      : {
          base: currentIds,
          types: [...new Set(current.map((u) => u.typeId))],
          step: -1,
        };
  // With one living type left, "everyone" and "that type" are the same set.
  const living = new Set(livingBase(world, cycle).map((u) => u.typeId));
  if (living.size < 2) return null;

  // Ring positions: -1 (everyone), then each type. Skip types with nobody left.
  const size = cycle.types.length + 1;
  let pos = cycle.step + 1;
  for (let i = 0; i < size; i++) {
    pos = (pos + dir + size) % size;
    const next: SubgroupCycle = { ...cycle, step: pos - 1 };
    const ids = idsAtStep(world, next);
    if (ids.length > 0) return { cycle: next, ids };
  }
  return null;
}
