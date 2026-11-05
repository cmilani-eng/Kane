/**
 * Battlefield combat — gameplay only (no Phaser).
 * Friendly fire off; death removes units/buildings; chase targets.
 */
import { getBuildingType } from '../../data/buildings';
import { getUnitType } from '../../data/units';
import { dist } from '../math';
import { damageBuilding } from './battlefieldBuildings';
import { incomingDamage, outgoingDamage } from './battlefieldFormations';
import { heroIncomingMult, heroOutgoingMult } from './battlefieldHeroes';
import {
  mutationIncomingMult,
  mutationOutgoingMult,
} from './battlefieldMutations';
import type {
  BattlefieldBuilding,
  BattlefieldUnit,
  BattlefieldWorld,
} from './battlefieldWorld';

type CombatTarget = BattlefieldUnit | BattlefieldBuilding;

function findTarget(
  world: BattlefieldWorld,
  id: number | null,
): CombatTarget | null {
  if (id == null) return null;
  return (
    world.units.find((u) => u.id === id) ??
    world.buildings.find((b) => b.id === id) ??
    null
  );
}

export function findEnemyAt(
  world: BattlefieldWorld,
  x: number,
  y: number,
  forTeam: BattlefieldUnit['team'] = 'player',
): CombatTarget | null {
  let best: CombatTarget | null = null;
  let bestD = Infinity;
  for (const u of world.units) {
    if (u.team === forTeam || u.team === 'neutral') continue;
    if (u.hp <= 0) continue;
    const d = dist(u.x, u.y, x, y);
    if (d <= u.radius + 22 && d < bestD) {
      best = u;
      bestD = d;
    }
  }
  for (const b of world.buildings) {
    if (b.team === forTeam || b.team === 'neutral') continue;
    if (b.hp <= 0) continue;
    const d = dist(b.x, b.y, x, y);
    if (d <= b.radius + 14 && d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

export function issueAttackSelected(
  world: BattlefieldWorld,
  target: CombatTarget,
): void {
  if (target.team === 'player' || target.hp <= 0) return;
  for (const u of world.units) {
    if (u.team !== 'player' || !u.selected) continue;
    u.moveTarget = null;
    u.gatherNodeId = null;
    u.attackMove = false;
    u.attackTargetId = target.id;
  }
}

function acquireNearestEnemy(
  world: BattlefieldWorld,
  u: BattlefieldUnit,
): CombatTarget | null {
  let best: CombatTarget | null = null;
  let bestD = u.vision;
  for (const o of world.units) {
    if (o.team === u.team || o.team === 'neutral') continue;
    if (o.hp <= 0) continue;
    const d = dist(u.x, u.y, o.x, o.y);
    if (d < bestD) {
      best = o;
      bestD = d;
    }
  }
  for (const b of world.buildings) {
    if (b.team === u.team || b.team === 'neutral') continue;
    if (b.hp <= 0 || !b.complete) continue;
    const d = dist(u.x, u.y, b.x, b.y);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

function removeDead(world: BattlefieldWorld): void {
  for (let i = world.units.length - 1; i >= 0; i--) {
    if (world.units[i]!.hp <= 0) world.units.splice(i, 1);
  }
  const ids = new Set([
    ...world.units.map((u) => u.id),
    ...world.buildings.map((b) => b.id),
  ]);
  for (const u of world.units) {
    if (u.attackTargetId != null && !ids.has(u.attackTargetId)) {
      u.attackTargetId = null;
    }
  }
}

export function tickBattlefieldCombat(
  world: BattlefieldWorld,
  dtMs: number,
): void {
  // Auto-acquire: enemies always; player when idle (not gathering / pure-moving).
  // Without this, player units in melee take hits but never fire back.
  for (const u of world.units) {
    if (u.team === 'neutral') continue;
    let t = findTarget(world, u.attackTargetId);
    if (t && t.hp > 0) continue;
    if (u.team === 'player') {
      if (u.gatherNodeId != null || u.carrying > 0) continue;
      // Honor pure move orders — attack-move may acquire while pathing.
      if (u.moveTarget != null && !u.attackMove) continue;
    }
    t = acquireNearestEnemy(world, u);
    u.attackTargetId = t?.id ?? null;
  }

  for (const u of world.units) {
    u.attackCd = Math.max(0, u.attackCd - dtMs);
    if (u.attackTargetId == null) continue;

    const t = findTarget(world, u.attackTargetId);
    if (!t || t.hp <= 0 || t.team === u.team) {
      u.attackTargetId = null;
      continue;
    }

    const d = dist(u.x, u.y, t.x, t.y);
    const reach = u.range + t.radius;
    if (d > reach) {
      u.moveTarget = { x: t.x, y: t.y };
      continue;
    }

    u.moveTarget = null;
    if (u.attackCd <= 0) {
      const udef = getUnitType(u.typeId);
      let raw =
        outgoingDamage(u, u.dmg) *
        heroOutgoingMult(world, u) *
        mutationOutgoingMult(u);
      const isBuilding = 'typeId' in t && 'buildProgress' in t;
      if (isBuilding) {
        raw *= udef.structureMult ?? 1;
        damageBuilding(world, t as BattlefieldBuilding, raw);
      } else {
        const victim = t as BattlefieldUnit;
        victim.hp -=
          incomingDamage(victim, raw) *
          heroIncomingMult(world, victim) *
          mutationIncomingMult(victim);
        if (victim.hp <= 0) victim.hp = 0;
      }
      u.attackCd = u.attackCooldownMs;
      u.lastAttackFlashMs = 120;
      if (t.hp <= 0) u.attackTargetId = null;
    }
  }

  for (const u of world.units) {
    if (u.lastAttackFlashMs > 0) {
      u.lastAttackFlashMs = Math.max(0, u.lastAttackFlashMs - dtMs);
    }
  }

  removeDead(world);
}

export function livingByTeam(
  world: BattlefieldWorld,
  team: BattlefieldUnit['team'],
): number {
  return world.units.filter((u) => u.team === team && u.hp > 0).length;
}

export function keepAlive(
  world: BattlefieldWorld,
  team: BattlefieldUnit['team'],
): boolean {
  return world.buildings.some(
    (b) =>
      b.team === team &&
      b.hp > 0 &&
      getBuildingType(b.typeId).isMainHall,
  );
}
