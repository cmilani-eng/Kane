/**
 * Chat-free attention ping — temporary “look here” mark on map + minimap.
 * Hard-capped for mobile FPS.
 */
import type { BattlefieldWorld } from './battlefieldWorld';

export interface AttentionPing {
  x: number;
  y: number;
  lifeMs: number;
  maxLifeMs: number;
}

const MAX_PINGS = 4;
const LIFE_MS = 3200;

export function ensureAttentionPings(world: BattlefieldWorld): void {
  if (!world.attentionPings) world.attentionPings = [];
}

export function tickAttentionPings(world: BattlefieldWorld, dtMs: number): void {
  ensureAttentionPings(world);
  const list = world.attentionPings;
  for (let i = list.length - 1; i >= 0; i--) {
    const fx = list[i]!;
    fx.lifeMs -= dtMs;
    if (fx.lifeMs <= 0) list.splice(i, 1);
  }
}

/** Drop a temporary attention mark at a world point. */
export function spawnAttentionPing(
  world: BattlefieldWorld,
  x: number,
  y: number,
): AttentionPing {
  ensureAttentionPings(world);
  const list = world.attentionPings;
  if (list.length >= MAX_PINGS) list.shift();
  const ping: AttentionPing = {
    x,
    y,
    lifeMs: LIFE_MS,
    maxLifeMs: LIFE_MS,
  };
  list.push(ping);
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
