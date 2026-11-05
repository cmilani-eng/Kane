/**
 * Deterministic grid pathfinding for Kane.
 * Straight-line waypoint path with building soft-avoidance.
 * Ready to swap for full A* without changing callers.
 */
import { MAP } from '../config/balance';
import { dist } from '../sim/math';
import type { Building, Vec2, World } from '../sim/types';

const CELL = MAP.tile;

export function worldToCell(x: number, y: number): { cx: number; cy: number } {
  return { cx: Math.floor(x / CELL), cy: Math.floor(y / CELL) };
}

export function cellToWorld(cx: number, cy: number): Vec2 {
  return { x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 };
}

function blocked(world: World, cx: number, cy: number): boolean {
  const p = cellToWorld(cx, cy);
  for (const b of world.buildings) {
    if (b.hp <= 0) continue;
    if (dist(p.x, p.y, b.x, b.y) < b.radius + 12) return true;
  }
  return false;
}

/** Returns a short waypoint list from start → goal (deterministic). */
export function findPath(world: World, from: Vec2, to: Vec2): Vec2[] {
  const goal: Vec2 = {
    x: clamp(to.x, 20, MAP.width - 20),
    y: clamp(to.y, 20, MAP.height - 20),
  };

  if (!segmentHitsBuilding(world, from, goal)) {
    return [goal];
  }

  const mid: Vec2 = {
    x: clamp((from.x + goal.x) / 2 + (from.y - goal.y) * 0.25, 20, MAP.width - 20),
    y: clamp((from.y + goal.y) / 2 + (goal.x - from.x) * 0.25, 20, MAP.height - 20),
  };
  const cell = worldToCell(mid.x, mid.y);
  if (blocked(world, cell.cx, cell.cy)) {
    return [goal];
  }
  return [mid, goal];
}

function segmentHitsBuilding(world: World, a: Vec2, b: Vec2): boolean {
  for (const building of world.buildings) {
    if (building.hp <= 0) continue;
    if (pointSegDist(building, a, b) < building.radius + 8) return true;
  }
  return false;
}

function pointSegDist(b: Building, a: Vec2, c: Vec2): number {
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((b.x - a.x) * dx + (b.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(b.x, b.y, a.x + t * dx, a.y + t * dy);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
