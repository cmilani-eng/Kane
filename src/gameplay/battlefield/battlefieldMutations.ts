/**
 * Weirdos MUTATION — unstable combat buff when allies cluster or lock with M.
 * Mutated units hit harder and move slightly faster, but take more damage.
 */
import { getUnitType } from '../../data/units';
import { dist } from '../math';
import type { BattlefieldUnit, BattlefieldWorld } from './battlefieldWorld';

export const MUTATION = {
  radius: 80,
  attackMult: 1.28,
  defenseMult: 1.18,
  speedMult: 1.12,
} as const;

/** Locks or unlocks mutation on one unit. Both clients run this for a synced stance order. */
export function toggleMutationUnit(u: BattlefieldUnit): void {
  const def = getUnitType(u.typeId);
  if (u.speciesId !== 'weirdos' || !def.canMutate) return;
  u.mutationLocked = !u.mutationLocked;
  if (u.mutationLocked) u.mutated = true;
}

export function toggleMutationSelected(world: BattlefieldWorld): void {
  for (const u of world.units) {
    if (u.team !== 'player' || !u.selected) continue;
    toggleMutationUnit(u);
  }
}

export function tickMutations(world: BattlefieldWorld, _dtMs: number): void {
  for (const u of world.units) {
    const def = getUnitType(u.typeId);
    if (u.speciesId !== 'weirdos' || !def.canMutate) {
      u.mutated = false;
      continue;
    }
    if (u.mutationLocked) {
      u.mutated = true;
      continue;
    }
    let allies = 0;
    for (const o of world.units) {
      if (o.id === u.id || o.team !== u.team || o.hp <= 0) continue;
      const odef = getUnitType(o.typeId);
      if (!odef.canMutate) continue;
      if (dist(u.x, u.y, o.x, o.y) <= MUTATION.radius) allies++;
    }
    u.mutated = allies >= 1;
  }
}

export function mutationOutgoingMult(attacker: BattlefieldUnit): number {
  const def = getUnitType(attacker.typeId);
  if (attacker.mutated && def.canMutate) return MUTATION.attackMult;
  return 1;
}

export function mutationIncomingMult(defender: BattlefieldUnit): number {
  const def = getUnitType(defender.typeId);
  if (defender.mutated && def.canMutate) return MUTATION.defenseMult;
  return 1;
}

export function mutationSpeedMult(unit: BattlefieldUnit): number {
  const def = getUnitType(unit.typeId);
  if (unit.mutated && def.canMutate) return MUTATION.speedMult;
  return 1;
}
