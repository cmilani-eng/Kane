/**
 * Brutes RAGE — offensive buff when fighting or locked with R.
 * Enraged units hit harder and move faster, but take more damage.
 */
import { getUnitType } from '../../data/units';
import { dist } from '../math';
import type { BattlefieldUnit, BattlefieldWorld } from './battlefieldWorld';

export const RAGE = {
  /** Nearby ally radius that helps sustain auto-rage. */
  radius: 90,
  attackMult: 1.32,
  defenseMult: 1.22,
  speedMult: 1.15,
  /** Auto-rage linger after leaving combat. */
  lingerMs: 900,
} as const;

/** Locks or unlocks rage on one unit. Both clients run this for a synced stance order. */
export function toggleRageUnit(u: BattlefieldUnit): void {
  const def = getUnitType(u.typeId);
  if (u.speciesId !== 'brutes' || !def.canRage) return;
  u.rageLocked = !u.rageLocked;
  if (u.rageLocked) u.enraged = true;
}

export function toggleRageSelected(world: BattlefieldWorld): void {
  for (const u of world.units) {
    if (u.team !== 'player' || !u.selected) continue;
    toggleRageUnit(u);
  }
}

export function tickRage(world: BattlefieldWorld, dtMs: number): void {
  for (const u of world.units) {
    const def = getUnitType(u.typeId);
    if (u.speciesId !== 'brutes' || !def.canRage) {
      u.enraged = false;
      u.rageCombatMs = 0;
      continue;
    }

    if (u.rageLocked) {
      u.enraged = true;
      continue;
    }

    // Auto: fighting, or near a fighting/enraged ally
    let hot = u.attackTargetId != null || u.lastAttackFlashMs > 0;
    if (!hot) {
      for (const o of world.units) {
        if (o.id === u.id || o.team !== u.team || o.hp <= 0) continue;
        const odef = getUnitType(o.typeId);
        if (!odef.canRage) continue;
        if (dist(u.x, u.y, o.x, o.y) > RAGE.radius) continue;
        if (o.enraged || o.attackTargetId != null) {
          hot = true;
          break;
        }
      }
    }

    if (hot) {
      u.rageCombatMs = RAGE.lingerMs;
    } else {
      u.rageCombatMs = Math.max(0, (u.rageCombatMs ?? 0) - dtMs);
    }
    u.enraged = u.rageCombatMs > 0;
  }
}

export function rageOutgoingMult(attacker: BattlefieldUnit): number {
  const def = getUnitType(attacker.typeId);
  if (attacker.enraged && def.canRage) return RAGE.attackMult;
  return 1;
}

export function rageIncomingMult(defender: BattlefieldUnit): number {
  const def = getUnitType(defender.typeId);
  if (defender.enraged && def.canRage) return RAGE.defenseMult;
  return 1;
}

export function rageSpeedMult(unit: BattlefieldUnit): number {
  const def = getUnitType(unit.typeId);
  if (unit.enraged && def.canRage) return RAGE.speedMult;
  return 1;
}
