/** Gameplay — unit / building selection. */
import { dist } from '../math';
import type { Building, Team, Unit, World } from '../types';

export function clearSelection(world: World): void {
  for (const u of world.units) u.selected = false;
  for (const b of world.buildings) b.selected = false;
}

export function selectInRect(
  world: World,
  team: Team,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  clearSelection(world);
  let any = false;
  for (const u of world.units) {
    if (u.team !== team) continue;
    if (u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
      u.selected = true;
      any = true;
    }
  }
  if (!any) {
    for (const b of world.buildings) {
      if (b.team !== team || b.buildProgress < 1) continue;
      if (b.x >= minX && b.x <= maxX && b.y >= minY && b.y <= maxY) {
        b.selected = true;
      }
    }
  }
}

export function selectAt(world: World, team: Team, x: number, y: number): boolean {
  clearSelection(world);
  let best: Unit | null = null;
  let bestD = Infinity;
  for (const u of world.units) {
    if (u.team !== team) continue;
    const d = dist(u.x, u.y, x, y);
    if (d <= u.radius + 16 && d < bestD) {
      best = u;
      bestD = d;
    }
  }
  if (best) {
    best.selected = true;
    return true;
  }
  for (const b of world.buildings) {
    if (b.team !== team || b.buildProgress < 1) continue;
    if (dist(b.x, b.y, x, y) <= b.radius + 20) {
      b.selected = true;
      return true;
    }
  }
  return false;
}

export function selectedUnits(world: World, team: Team): Unit[] {
  return world.units.filter((u) => u.team === team && u.selected);
}

export function selectedBuilding(world: World, team: Team): Building | null {
  return world.buildings.find((b) => b.team === team && b.selected) ?? null;
}

export function selectAllOfKind(
  world: World,
  team: Team,
  kind: Unit['kind'],
): void {
  clearSelection(world);
  for (const u of world.units) {
    if (u.team === team && u.kind === kind) u.selected = true;
  }
}
