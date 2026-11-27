/**
 * Nobles FORMATIONS — defensive/offensive bonus when clustered allies hold.
 * Auto: military units near ≥1 ally within radius and nearly still.
 * Manual: F toggles formation lock on selected Nobles military.
 */
import { getUnitType } from '../../data/units';
import { dist } from '../math';
import type { BattlefieldUnit, BattlefieldWorld } from './battlefieldWorld';

export const FORMATION = {
  radius: 70,
  /** Incoming damage multiplier while formed. */
  defenseMult: 0.72,
  /** Outgoing damage multiplier while formed. */
  attackMult: 1.12,
  stillSpeed: 18,
} as const;

/** Locks or unlocks formation on one unit. Both clients run this for a synced stance order. */
export function toggleFormationUnit(u: BattlefieldUnit): void {
  const def = getUnitType(u.typeId);
  if (u.speciesId !== 'nobles' || !def.usesFormation) return;
  u.formationLocked = !u.formationLocked;
  if (u.formationLocked) u.inFormation = true;
}

export function toggleFormationSelected(world: BattlefieldWorld): void {
  for (const u of world.units) {
    if (u.team !== 'player' || !u.selected) continue;
    toggleFormationUnit(u);
  }
}

export function tickFormations(world: BattlefieldWorld, dtMs: number): void {
  const dt = Math.min(dtMs, 50) / 1000;
  for (const u of world.units) {
    // Track approximate speed from last move
    if (u.moveTarget) {
      u.formationStillMs = 0;
    } else {
      u.formationStillMs = (u.formationStillMs ?? 0) + dtMs;
    }

    const def = getUnitType(u.typeId);
    if (u.speciesId !== 'nobles' || !def.usesFormation) {
      u.inFormation = false;
      continue;
    }

    if (u.formationLocked) {
      u.inFormation = true;
      continue;
    }

    // Auto: near another formation-capable ally and not sprinting to a distant goal
    let allies = 0;
    for (const o of world.units) {
      if (o.id === u.id || o.team !== u.team || o.hp <= 0) continue;
      const odef = getUnitType(o.typeId);
      if (!odef.usesFormation) continue;
      if (dist(u.x, u.y, o.x, o.y) <= FORMATION.radius) allies++;
    }
    const holding =
      !u.moveTarget || (u.formationStillMs ?? 0) > 350 || allies >= 2;
    u.inFormation = allies >= 1 && holding;
  }
  void dt;
}

export function outgoingDamage(attacker: BattlefieldUnit, base: number): number {
  const def = getUnitType(attacker.typeId);
  let dmg = base;
  if (attacker.inFormation && def.usesFormation) dmg *= FORMATION.attackMult;
  return dmg;
}

export function incomingDamage(defender: BattlefieldUnit, amount: number): number {
  const def = getUnitType(defender.typeId);
  if (defender.inFormation && def.usesFormation) {
    return amount * FORMATION.defenseMult;
  }
  return amount;
}
