/**
 * Gather / deposit FX — gameplay events for presentation ticks & pops.
 * Cap pool size for mobile FPS.
 */
import type { ResourceId } from '../../data/resources';
import { RESOURCES } from '../../data/resources';
import type { BattlefieldWorld } from './battlefieldWorld';

export type EconomyFxKind = 'gather' | 'deposit';

export interface EconomyFx {
  kind: EconomyFxKind;
  resourceId: ResourceId;
  x: number;
  y: number;
  color: number;
  radius: number;
  lifeMs: number;
  maxLifeMs: number;
  seed: number;
  /** Mute-aware SFX hint for presentation (`gather` / `deposit`). */
  sfx: 'gather' | 'deposit';
}

const MAX_FX = 28;

export function ensureEconomyFx(world: BattlefieldWorld): void {
  if (!world.economyFx) world.economyFx = [];
}

export function pushEconomyFx(
  world: BattlefieldWorld,
  kind: EconomyFxKind,
  resourceId: ResourceId,
  x: number,
  y: number,
  radius: number,
  lifeMs: number,
): void {
  ensureEconomyFx(world);
  const list = world.economyFx;
  if (list.length >= MAX_FX) list.shift();
  const color = RESOURCES[resourceId].color;
  list.push({
    kind,
    resourceId,
    x,
    y,
    color,
    radius,
    lifeMs,
    maxLifeMs: lifeMs,
    seed: (x * 11 + y * 19 + list.length * 23) | 0,
    sfx: kind === 'deposit' ? 'deposit' : 'gather',
  });
}

export function spawnGatherFx(
  world: BattlefieldWorld,
  resourceId: ResourceId,
  x: number,
  y: number,
): void {
  pushEconomyFx(world, 'gather', resourceId, x, y, 16, 280);
}

export function spawnDepositFx(
  world: BattlefieldWorld,
  resourceId: ResourceId,
  x: number,
  y: number,
): void {
  pushEconomyFx(world, 'deposit', resourceId, x, y, 22, 360);
}

export function tickEconomyFx(world: BattlefieldWorld, dtMs: number): void {
  ensureEconomyFx(world);
  const list = world.economyFx;
  for (let i = list.length - 1; i >= 0; i--) {
    const fx = list[i]!;
    fx.lifeMs -= dtMs;
    if (fx.lifeMs <= 0) list.splice(i, 1);
  }
}
