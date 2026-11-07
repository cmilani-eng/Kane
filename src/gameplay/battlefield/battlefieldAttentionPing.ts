/**
 * Chat-free attention ping — temporary “look here” mark on map + minimap.
 * Hard-capped for mobile FPS.
 */
import { mapSectorAt, type MapSectorId } from './mapSector';
import type { BattlefieldWorld } from './battlefieldWorld';

export interface AttentionPing {
  x: number;
  y: number;
  lifeMs: number;
  maxLifeMs: number;
}

/** Brief HUD / minimap sector chip after a hold-to-ping drop. */
export interface AttentionPingSectorHint {
  sector: MapSectorId;
  lifeMs: number;
  x: number;
  y: number;
}

const MAX_PINGS = 4;
const LIFE_MS = 3200;
/** Quiet gap between hold-to-ping drops (minimap spam guard). */
export const ATTENTION_PING_COOLDOWN_MS = 1400;
/** How long the ping sector chip stays on HUD / minimap. */
export const ATTENTION_PING_SECTOR_HINT_MS = 2200;

/** True while the hold-to-ping control should refuse a new mark. */
export function attentionPingOnCooldown(remainMs: number): boolean {
  return remainMs > 0;
}

export function ensureAttentionPings(world: BattlefieldWorld): void {
  if (!world.attentionPings) world.attentionPings = [];
}

export function ensureAttentionPingSectorHint(world: BattlefieldWorld): void {
  if (world.attentionPingSectorHint === undefined) {
    world.attentionPingSectorHint = null;
  }
}

export function tickAttentionPings(world: BattlefieldWorld, dtMs: number): void {
  ensureAttentionPings(world);
  ensureAttentionPingSectorHint(world);
  const list = world.attentionPings;
  for (let i = list.length - 1; i >= 0; i--) {
    const fx = list[i]!;
    fx.lifeMs -= dtMs;
    if (fx.lifeMs <= 0) list.splice(i, 1);
  }
  if (world.attentionPingSectorHint) {
    world.attentionPingSectorHint.lifeMs -= dtMs;
    if (world.attentionPingSectorHint.lifeMs <= 0) {
      world.attentionPingSectorHint = null;
    }
  }
}

/** Drop a temporary attention mark at a world point. */
export function spawnAttentionPing(
  world: BattlefieldWorld,
  x: number,
  y: number,
): AttentionPing {
  ensureAttentionPings(world);
  ensureAttentionPingSectorHint(world);
  const list = world.attentionPings;
  if (list.length >= MAX_PINGS) list.shift();
  const ping: AttentionPing = {
    x,
    y,
    lifeMs: LIFE_MS,
    maxLifeMs: LIFE_MS,
  };
  list.push(ping);
  world.attentionPingSectorHint = {
    sector: mapSectorAt(x, y),
    lifeMs: ATTENTION_PING_SECTOR_HINT_MS,
    x,
    y,
  };
  return ping;
}

export const ATTENTION_PING_LIFE_MS = LIFE_MS;
export const ATTENTION_PING_MAX = MAX_PINGS;

/**
 * Lifetime opacity factor: 1 at spawn → 0 at expiry.
 * Squared ease so the final third reads as a clear fade (no hard cut).
 */
export function attentionPingFade(lifeMs: number, maxLifeMs: number): number {
  if (maxLifeMs <= 0 || lifeMs <= 0) return 0;
  const t = Math.min(1, lifeMs / maxLifeMs);
  return t * t;
}
