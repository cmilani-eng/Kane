/**
 * Battlefield combat — gameplay only (no Phaser).
 * Friendly fire off; death removes units; attack-move via target chase.
 */
import { dist } from '../math';
import type { BattlefieldUnit, BattlefieldWorld } from './battlefieldWorld';

function findUnit(
  world: BattlefieldWorld,
  id: number | null,
): BattlefieldUnit | null {
  if (id == null) return null;
  return world.units.find((u) => u.id === id) ?? null;
}

export function findEnemyAt(
  world: BattlefieldWorld,
  x: number,
  y: number,
  forTeam: BattlefieldUnit['team'] = 'player',
): BattlefieldUnit | null {
  let best: BattlefieldUnit | null = null;
  let bestD = Infinity;
  for (const u of world.units) {
    if (u.team === forTeam || u.team === 'neutral') continue;
    if (u.hp <= 0) continue;
    const d = dist(u.x, u.y, x, y);
    if (d <= u.radius + 14 && d < bestD) {
      best = u;
      bestD = d;
    }
  }
  return best;
}

/** RMB on enemy: selected friendlies attack that target. */
export function issueAttackSelected(
  world: BattlefieldWorld,
  target: BattlefieldUnit,
): void {
  if (target.team === 'player' || target.hp <= 0) return;
  for (const u of world.units) {
    if (u.team !== 'player' || !u.selected) continue;
    u.moveTarget = null;
    u.attackTargetId = target.id;
  }
}

/** Clear attack when issuing a plain move. */
export function clearAttackOrders(world: BattlefieldWorld): void {
  for (const u of world.units) {
    if (u.selected && u.team === 'player') u.attackTargetId = null;
  }
}

function acquireNearestEnemy(
  world: BattlefieldWorld,
  u: BattlefieldUnit,
): BattlefieldUnit | null {
  let best: BattlefieldUnit | null = null;
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
  return best;
}

function removeDead(world: BattlefieldWorld): void {
  for (let i = world.units.length - 1; i >= 0; i--) {
    const u = world.units[i]!;
    if (u.hp <= 0) {
      world.units.splice(i, 1);
    }
  }
  // Drop stale selection / targets pointing at removed ids
  const ids = new Set(world.units.map((u) => u.id));
  for (const u of world.units) {
    if (u.attackTargetId != null && !ids.has(u.attackTargetId)) {
      u.attackTargetId = null;
    }
  }
}

/**
 * Resolve attacks + simple enemy auto-acquire (stand/chase).
 * Call after movement tick.
 */
export function tickBattlefieldCombat(
  world: BattlefieldWorld,
  dtMs: number,
): void {
  // Simple enemy “AI”: acquire / chase nearest player in vision
  for (const u of world.units) {
    if (u.team !== 'enemy') continue;
    let t = findUnit(world, u.attackTargetId);
    if (!t || t.hp <= 0) {
      t = acquireNearestEnemy(world, u);
      u.attackTargetId = t?.id ?? null;
    }
  }

  for (const u of world.units) {
    u.attackCd = Math.max(0, u.attackCd - dtMs);
    if (u.attackTargetId == null) continue;

    const t = findUnit(world, u.attackTargetId);
    if (!t || t.hp <= 0 || t.team === u.team) {
      u.attackTargetId = null;
      continue;
    }

    // Friendly fire already prevented by team check above
    const d = dist(u.x, u.y, t.x, t.y);
    const reach = u.range + t.radius;
    if (d > reach) {
      u.moveTarget = { x: t.x, y: t.y };
      continue;
    }

    u.moveTarget = null;
    if (u.attackCd <= 0) {
      t.hp -= u.dmg;
      u.attackCd = u.attackCooldownMs;
      u.lastAttackFlashMs = 120;
      if (t.hp <= 0) {
        t.hp = 0;
        u.attackTargetId = null;
      }
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
