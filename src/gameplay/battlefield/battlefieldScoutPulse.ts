/**
 * Fog scout reveal pulses — brief rings when units explore new cells.
 * Hard-capped for mobile FPS.
 */
import {
  FOG_CELL,
  FOG_COLS,
  type FogState,
} from './battlefieldFog';
import type { BattlefieldWorld } from './battlefieldWorld';
import { mapSectorAt, type MapSectorId } from './mapSector';

export interface ScoutPulse {
  x: number;
  y: number;
  lifeMs: number;
  maxLifeMs: number;
  /** 3×3 map sector for HUD callouts. */
  sector: MapSectorId;
}

/** Brief HUD chip after a scout pulse lands. */
export interface ScoutSectorHint {
  sector: MapSectorId;
  lifeMs: number;
}

const MAX_FX = 10;
const LIFE_MS = 480;
/** How long the HUD keeps the sector label after a pulse. */
export const SCOUT_SECTOR_HINT_MS = 1400;
/** Max new-cell samples converted to pulses per fog tick. */
const MAX_SPAWN_PER_TICK = 6;

export function ensureScoutPulses(world: BattlefieldWorld): void {
  if (!world.scoutPulses) world.scoutPulses = [];
}

export function ensureScoutSectorHint(world: BattlefieldWorld): void {
  if (world.scoutSectorHint === undefined) world.scoutSectorHint = null;
}

export function tickScoutPulses(world: BattlefieldWorld, dtMs: number): void {
  ensureScoutPulses(world);
  const list = world.scoutPulses;
  for (let i = list.length - 1; i >= 0; i--) {
    const fx = list[i]!;
    fx.lifeMs -= dtMs;
    if (fx.lifeMs <= 0) list.splice(i, 1);
  }
  ensureScoutSectorHint(world);
  if (world.scoutSectorHint) {
    world.scoutSectorHint.lifeMs -= dtMs;
    if (world.scoutSectorHint.lifeMs <= 0) world.scoutSectorHint = null;
  }
}

/**
 * Spawn a few pulses from cells newly explored this fog tick.
 * Subsamples when many cells unlock at once.
 */
export function spawnScoutPulsesFromFog(
  world: BattlefieldWorld,
  fog: FogState,
): void {
  const n = fog.newExploreCount;
  if (n <= 0) return;
  ensureScoutPulses(world);
  ensureScoutSectorHint(world);
  const list = world.scoutPulses;
  const step = Math.max(1, Math.ceil(n / MAX_SPAWN_PER_TICK));
  let spawned = 0;
  let lastSector: MapSectorId | null = null;
  for (let k = 0; k < n && spawned < MAX_SPAWN_PER_TICK; k += step) {
    const cell = fog.newExploreIdx[k]!;
    const cx = cell % FOG_COLS;
    const cy = (cell / FOG_COLS) | 0;
    const x = cx * FOG_CELL + FOG_CELL * 0.5;
    const y = cy * FOG_CELL + FOG_CELL * 0.5;
    const sector = mapSectorAt(x, y);
    if (list.length >= MAX_FX) list.shift();
    list.push({
      x,
      y,
      lifeMs: LIFE_MS,
      maxLifeMs: LIFE_MS,
      sector,
    });
    lastSector = sector;
    spawned++;
  }
  if (lastSector) {
    world.scoutSectorHint = {
      sector: lastSector,
      lifeMs: SCOUT_SECTOR_HINT_MS,
    };
  }
}
