/**
 * Select-all military — player combat units only (not workers), fog-visible.
 */
import type {
  BattlefieldUnit,
  BattlefieldWorld,
} from './battlefieldWorld';
import { clearSelection } from './battlefieldWorld';
import { isVisible } from './battlefieldFog';

/** Combat unit: living player unit that cannot gather (army + heroes). */
export function isMilitaryUnit(u: BattlefieldUnit): boolean {
  return u.team === 'player' && u.hp > 0 && !u.canGather;
}

export function listVisibleMilitary(world: BattlefieldWorld): BattlefieldUnit[] {
  return world.units.filter(
    (u) => isMilitaryUnit(u) && isVisible(world.fog, u.x, u.y),
  );
}

export function countVisibleMilitary(world: BattlefieldWorld): number {
  let n = 0;
  for (const u of world.units) {
    if (isMilitaryUnit(u) && isVisible(world.fog, u.x, u.y)) n++;
  }
  return n;
}

/** Select every fog-visible player combat unit. Returns how many selected. */
export function selectAllVisibleMilitary(world: BattlefieldWorld): number {
  const army = listVisibleMilitary(world);
  if (army.length === 0) return 0;
  clearSelection(world);
  for (const u of army) u.selected = true;
  return army.length;
}
