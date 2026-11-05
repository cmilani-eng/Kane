/**
 * Simple fog of war — explored vs currently visible.
 * Coarse grid for mobile-friendly updates.
 */
import { MAP } from '../../config/balance';
import { getBuildingType } from '../../data/buildings';
import { dist } from '../math';
import type { BattlefieldWorld } from './battlefieldWorld';

/** Fog cell size in world px — larger = cheaper. */
export const FOG_CELL = 80;

export const FOG_COLS = Math.ceil(MAP.width / FOG_CELL);
export const FOG_ROWS = Math.ceil(MAP.height / FOG_CELL);

export interface FogState {
  /** 1 = ever seen by the player. */
  explored: Uint8Array;
  /** 1 = currently in vision. Cleared/rebuilt each tick. */
  visible: Uint8Array;
  /** Previous visible snapshot — skip redraw when unchanged. */
  prevVisible: Uint8Array;
  /** Dirty flag so presentation can skip redraws. */
  version: number;
  /** True when explored grew this tick (forces redraw). */
  exploredDirty: boolean;
}

export function createFogState(): FogState {
  const n = FOG_COLS * FOG_ROWS;
  return {
    explored: new Uint8Array(n),
    visible: new Uint8Array(n),
    prevVisible: new Uint8Array(n),
    version: 0,
    exploredDirty: false,
  };
}

function idx(cx: number, cy: number): number {
  return cy * FOG_COLS + cx;
}

export function worldToFog(x: number, y: number): { cx: number; cy: number } {
  return {
    cx: Math.max(0, Math.min(FOG_COLS - 1, Math.floor(x / FOG_CELL))),
    cy: Math.max(0, Math.min(FOG_ROWS - 1, Math.floor(y / FOG_CELL))),
  };
}

export function isExplored(fog: FogState, x: number, y: number): boolean {
  const { cx, cy } = worldToFog(x, y);
  return fog.explored[idx(cx, cy)] === 1;
}

export function isVisible(fog: FogState, x: number, y: number): boolean {
  const { cx, cy } = worldToFog(x, y);
  return fog.visible[idx(cx, cy)] === 1;
}

function paintVision(
  fog: FogState,
  x: number,
  y: number,
  radius: number,
): void {
  const r = radius;
  const r2 = r * r;
  const minCx = Math.max(0, Math.floor((x - r) / FOG_CELL));
  const maxCx = Math.min(FOG_COLS - 1, Math.floor((x + r) / FOG_CELL));
  const minCy = Math.max(0, Math.floor((y - r) / FOG_CELL));
  const maxCy = Math.min(FOG_ROWS - 1, Math.floor((y + r) / FOG_CELL));
  for (let cy = minCy; cy <= maxCy; cy++) {
    for (let cx = minCx; cx <= maxCx; cx++) {
      const wx = cx * FOG_CELL + FOG_CELL * 0.5;
      const wy = cy * FOG_CELL + FOG_CELL * 0.5;
      const dx = wx - x;
      const dy = wy - y;
      if (dx * dx + dy * dy > r2) continue;
      const i = idx(cx, cy);
      fog.visible[i] = 1;
      if (fog.explored[i] === 0) {
        fog.explored[i] = 1;
        fog.exploredDirty = true;
      }
    }
  }
}

/** Rebuild current vision from player units + completed buildings. */
export function tickFog(world: BattlefieldWorld, fog: FogState): void {
  fog.exploredDirty = false;
  fog.visible.fill(0);
  for (const u of world.units) {
    if (u.team !== 'player' || u.hp <= 0) continue;
    paintVision(fog, u.x, u.y, u.vision);
  }
  for (const b of world.buildings) {
    if (b.team !== 'player' || !b.complete || b.hp <= 0) continue;
    const hall = getBuildingType(b.typeId).isMainHall;
    paintVision(fog, b.x, b.y, hall ? 280 : 160);
  }
  let visChanged = fog.exploredDirty;
  if (!visChanged) {
    const a = fog.visible;
    const b = fog.prevVisible;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        visChanged = true;
        break;
      }
    }
  }
  if (visChanged) {
    fog.prevVisible.set(fog.visible);
    fog.version++;
  }
}

/** True if an enemy entity should render / be targetable by click. */
export function enemyRevealed(
  fog: FogState,
  x: number,
  y: number,
): boolean {
  return isVisible(fog, x, y);
}

/** Optional: skip player auto-acquire on targets hidden in fog. */
export function canPlayerSeeTarget(
  fog: FogState,
  x: number,
  y: number,
): boolean {
  return isVisible(fog, x, y);
}

export function fogCellCenter(cx: number, cy: number): { x: number; y: number } {
  return {
    x: cx * FOG_CELL + FOG_CELL * 0.5,
    y: cy * FOG_CELL + FOG_CELL * 0.5,
  };
}

export function fogDistSample(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return dist(ax, ay, bx, by);
}
