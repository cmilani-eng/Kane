/**
 * Battlefield pathfinding — building-aware waypoints, coarse A* for mobile.
 */
import { MAP } from '../../config/balance';
import { clamp, dist } from '../math';
import type { Vec2 } from '../types';
import type { BattlefieldUnit, BattlefieldWorld } from './battlefieldWorld';

/** Coarse cell — larger = cheaper A*. */
export const PATH_CELL = 64;

const COLS = Math.ceil(MAP.width / PATH_CELL);
const ROWS = Math.ceil(MAP.height / PATH_CELL);

function cellCenter(cx: number, cy: number): Vec2 {
  return {
    x: cx * PATH_CELL + PATH_CELL * 0.5,
    y: cy * PATH_CELL + PATH_CELL * 0.5,
  };
}

function toCell(x: number, y: number): { cx: number; cy: number } {
  return {
    cx: Math.max(0, Math.min(COLS - 1, Math.floor(x / PATH_CELL))),
    cy: Math.max(0, Math.min(ROWS - 1, Math.floor(y / PATH_CELL))),
  };
}

function pointSegDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(px, py, ax + t * dx, ay + t * dy);
}

function segmentHitsBuilding(
  world: BattlefieldWorld,
  a: Vec2,
  b: Vec2,
  pad: number,
  ignoreId: number | null,
): boolean {
  for (const building of world.buildings) {
    if (building.hp <= 0) continue;
    if (ignoreId != null && building.id === ignoreId) continue;
    if (pointSegDist(building.x, building.y, a.x, a.y, b.x, b.y) < building.radius + pad) {
      return true;
    }
  }
  return false;
}

function cellBlocked(
  world: BattlefieldWorld,
  cx: number,
  cy: number,
  pad: number,
  allowNear: Vec2 | null,
): boolean {
  const p = cellCenter(cx, cy);
  if (allowNear && dist(p.x, p.y, allowNear.x, allowNear.y) < PATH_CELL * 0.85) {
    return false;
  }
  for (const b of world.buildings) {
    if (b.hp <= 0) continue;
    if (dist(p.x, p.y, b.x, b.y) < b.radius + pad) return true;
  }
  return false;
}

/** 4-neighbor BFS — map is small (~37×25). Returns world waypoints or []. */
function bfsPath(
  world: BattlefieldWorld,
  from: Vec2,
  to: Vec2,
  pad: number,
): Vec2[] {
  const start = toCell(from.x, from.y);
  const goal = toCell(to.x, to.y);
  if (start.cx === goal.cx && start.cy === goal.cy) return [to];

  const key = (cx: number, cy: number) => cy * COLS + cx;
  const came = new Int32Array(COLS * ROWS).fill(-1);
  const q: number[] = [key(start.cx, start.cy)];
  came[q[0]!] = q[0]!;

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  let found = false;
  let head = 0;
  while (head < q.length) {
    const cur = q[head++]!;
    const cx = cur % COLS;
    const cy = (cur / COLS) | 0;
    if (cx === goal.cx && cy === goal.cy) {
      found = true;
      break;
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const nk = key(nx, ny);
      if (came[nk] !== -1) continue;
      const isStart = nx === start.cx && ny === start.cy;
      const isGoal = nx === goal.cx && ny === goal.cy;
      // Start/goal cells stay walkable so units can leave/enter building rings.
      if (!isStart && !isGoal && cellBlocked(world, nx, ny, pad, null)) {
        continue;
      }
      came[nk] = cur;
      q.push(nk);
    }
  }

  if (!found) return [to];

  const cells: { cx: number; cy: number }[] = [];
  let cur = key(goal.cx, goal.cy);
  const startK = key(start.cx, start.cy);
  while (cur !== startK) {
    cells.push({ cx: cur % COLS, cy: (cur / COLS) | 0 });
    cur = came[cur]!;
    if (cur < 0) break;
  }
  cells.reverse();

  // Collapse to world points; skip start cell; end at exact goal.
  const out: Vec2[] = [];
  for (let i = 0; i < cells.length - 1; i++) {
    const c = cells[i]!;
    out.push(cellCenter(c.cx, c.cy));
  }
  out.push(to);
  return simplify(world, from, out, pad);
}

function simplify(
  world: BattlefieldWorld,
  from: Vec2,
  path: Vec2[],
  pad: number,
): Vec2[] {
  if (path.length <= 1) return path;
  const out: Vec2[] = [];
  let anchor = from;
  let i = 0;
  while (i < path.length) {
    let farthest = i;
    for (let j = i; j < path.length; j++) {
      if (!segmentHitsBuilding(world, anchor, path[j]!, pad, null)) {
        farthest = j;
      }
    }
    out.push(path[farthest]!);
    anchor = path[farthest]!;
    i = farthest + 1;
  }
  return out;
}

/**
 * Build a path around buildings. Direct line when clear.
 */
export function findBattlefieldPath(
  world: BattlefieldWorld,
  from: Vec2,
  to: Vec2,
  unitRadius = 12,
): Vec2[] {
  const goal: Vec2 = {
    x: clamp(to.x, 20, MAP.width - 20),
    y: clamp(to.y, 20, MAP.height - 20),
  };
  const pad = unitRadius + 6;
  if (!segmentHitsBuilding(world, from, goal, pad, null)) {
    return [goal];
  }
  return bfsPath(world, from, goal, pad);
}

/** Assign path + first waypoint; clears when empty. */
export function setUnitPath(
  world: BattlefieldWorld,
  u: BattlefieldUnit,
  goal: Vec2,
): void {
  const path = findBattlefieldPath(
    world,
    { x: u.x, y: u.y },
    goal,
    u.radius,
  );
  u.path = path.slice(1);
  u.moveTarget = path[0] ?? { ...goal };
}

export function clearUnitPath(u: BattlefieldUnit): void {
  u.path = [];
  u.moveTarget = null;
}
