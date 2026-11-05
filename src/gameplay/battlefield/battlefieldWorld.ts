/**
 * Milestone 1 gameplay — placeholder units, selection, move orders only.
 * No combat / economy / buildings / AI.
 */
import { MAP } from '../../config/balance';
import { clamp, dist, moveToward } from '../math';
import type { Vec2 } from '../types';

export type PlaceholderTeam = 'player' | 'neutral';

export interface PlaceholderUnit {
  id: number;
  team: PlaceholderTeam;
  x: number;
  y: number;
  radius: number;
  speed: number;
  selected: boolean;
  moveTarget: Vec2 | null;
  /** Tint key for presentation. */
  color: number;
}

export interface BattlefieldWorld {
  nextId: number;
  units: PlaceholderUnit[];
}

export function createBattlefieldWorld(): BattlefieldWorld {
  const world: BattlefieldWorld = { nextId: 1, units: [] };
  // Player squad — temporary geometric placeholders
  const baseX = 400;
  const baseY = MAP.height - 400;
  const colors = [0x3d7ea6, 0x4a9bc4, 0x2f6f94, 0x5aadce, 0xf0c75e, 0xe8b84a];
  for (let i = 0; i < 6; i++) {
    world.units.push({
      id: world.nextId++,
      team: 'player',
      x: baseX + (i % 3) * 48,
      y: baseY + Math.floor(i / 3) * 48,
      radius: 14,
      speed: 110,
      selected: false,
      moveTarget: null,
      color: colors[i]!,
    });
  }
  // Neutral markers so the field isn't empty
  world.units.push({
    id: world.nextId++,
    team: 'neutral',
    x: MAP.width * 0.5,
    y: MAP.height * 0.5,
    radius: 16,
    speed: 0,
    selected: false,
    moveTarget: null,
    color: 0x8a8a8a,
  });
  return world;
}

export function clearSelection(world: BattlefieldWorld): void {
  for (const u of world.units) u.selected = false;
}

export function selectAt(
  world: BattlefieldWorld,
  x: number,
  y: number,
): boolean {
  clearSelection(world);
  let best: PlaceholderUnit | null = null;
  let bestD = Infinity;
  for (const u of world.units) {
    if (u.team !== 'player') continue;
    const d = dist(u.x, u.y, x, y);
    if (d <= u.radius + 12 && d < bestD) {
      best = u;
      bestD = d;
    }
  }
  if (best) {
    best.selected = true;
    return true;
  }
  return false;
}

export function selectInRect(
  world: BattlefieldWorld,
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
  for (const u of world.units) {
    if (u.team !== 'player') continue;
    if (u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
      u.selected = true;
    }
  }
}

export function issueMoveSelected(
  world: BattlefieldWorld,
  x: number,
  y: number,
): void {
  const selected = world.units.filter((u) => u.selected && u.team === 'player');
  selected.forEach((u, i) => {
    const ox = (i % 3) * 20 - 20;
    const oy = Math.floor(i / 3) * 20;
    u.moveTarget = {
      x: clamp(x + ox, 20, MAP.width - 20),
      y: clamp(y + oy, 20, MAP.height - 20),
    };
  });
}

export function tickBattlefield(world: BattlefieldWorld, dtMs: number): void {
  const dt = Math.min(dtMs, 50) / 1000;
  for (const u of world.units) {
    if (!u.moveTarget || u.speed <= 0) continue;
    const next = moveToward(
      u.x,
      u.y,
      u.moveTarget.x,
      u.moveTarget.y,
      u.speed,
      dt,
    );
    u.x = next.x;
    u.y = next.y;
    if (dist(u.x, u.y, u.moveTarget.x, u.moveTarget.y) < 4) {
      u.moveTarget = null;
    }
  }
}

export function selectedCount(world: BattlefieldWorld): number {
  return world.units.filter((u) => u.selected).length;
}
