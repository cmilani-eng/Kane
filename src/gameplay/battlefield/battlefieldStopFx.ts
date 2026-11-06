/**
 * Stop-command pulses — brief rings when S / Stop halts units.
 * Cap pool for mobile FPS.
 */
import type { BattlefieldWorld } from './battlefieldWorld';
import { selectedUnits } from './battlefieldWorld';

export interface StopFx {
  x: number;
  y: number;
  radius: number;
  color: number;
  lifeMs: number;
  maxLifeMs: number;
}

const MAX_FX = 24;
const LIFE_MS = 320;

export function ensureStopFx(world: BattlefieldWorld): void {
  if (!world.stopFx) world.stopFx = [];
}

/** Spawn a short halt pulse on each currently selected unit. */
export function spawnStopPulses(world: BattlefieldWorld): number {
  ensureStopFx(world);
  const list = world.stopFx;
  let n = 0;
  for (const u of selectedUnits(world)) {
    if (list.length >= MAX_FX) list.shift();
    list.push({
      x: u.x,
      y: u.y,
      radius: u.radius + 10,
      color: 0xf0c75e,
      lifeMs: LIFE_MS,
      maxLifeMs: LIFE_MS,
    });
    n++;
  }
  return n;
}

export function tickStopFx(world: BattlefieldWorld, dtMs: number): void {
  ensureStopFx(world);
  const list = world.stopFx;
  for (let i = list.length - 1; i >= 0; i--) {
    const fx = list[i]!;
    fx.lifeMs -= dtMs;
    if (fx.lifeMs <= 0) list.splice(i, 1);
  }
}
