/** Combat resolution — pure sim, no rendering. */
import { COMBAT } from '../config/balance';
import { dist } from '../sim/math';
import type { Building, Team, Unit, World } from '../sim/types';

function findById(world: World, id: number): Unit | Building | null {
  return (
    world.units.find((u) => u.id === id) ??
    world.buildings.find((b) => b.id === id) ??
    null
  );
}

export function destroyEntity(world: World, e: Unit | Building): void {
  const ui = world.units.findIndex((u) => u.id === e.id);
  if (ui >= 0) {
    world.units.splice(ui, 1);
    return;
  }
  const bi = world.buildings.findIndex((b) => b.id === e.id);
  if (bi >= 0) {
    const b = world.buildings[bi]!;
    if (b.kind === 'keep') b.hp = 0;
    else world.buildings.splice(bi, 1);
  }
}

export function autoAcquire(world: World, u: Unit): void {
  let best: Unit | Building | null = null;
  let bestD = u.vision * 0.55;
  for (const o of world.units) {
    if (o.team === u.team) continue;
    const d = dist(u.x, u.y, o.x, o.y);
    if (d < bestD) {
      best = o;
      bestD = d;
    }
  }
  for (const b of world.buildings) {
    if (b.team === u.team || b.team === 'neutral') continue;
    const d = dist(u.x, u.y, b.x, b.y);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  if (best) u.targetId = best.id;
}

export function tickCombat(world: World, dtMs: number): void {
  for (const u of world.units) {
    u.attackCd = Math.max(0, u.attackCd - dtMs);
    if (u.targetId == null) continue;
    const t = findById(world, u.targetId);
    if (!t || t.hp <= 0) {
      u.targetId = null;
      continue;
    }
    const d = dist(u.x, u.y, t.x, t.y);
    const reach = u.range + t.radius;
    if (d > reach) {
      u.moveTarget = { x: t.x, y: t.y };
      u.path = [];
    } else {
      u.moveTarget = null;
      u.path = [];
      if (u.attackCd <= 0) {
        t.hp -= u.dmg;
        u.attackCd = COMBAT.attackCooldownMs;
        if (t.hp <= 0) {
          destroyEntity(world, t);
          u.targetId = null;
        }
      }
    }
  }
}

export function issueAttack(
  world: World,
  team: Team,
  target: Unit | Building,
): void {
  for (const u of world.units) {
    if (u.team !== team || !u.selected) continue;
    u.gatherNodeId = null;
    u.path = [];
    u.moveTarget = null;
    u.targetId = target.id;
  }
}
