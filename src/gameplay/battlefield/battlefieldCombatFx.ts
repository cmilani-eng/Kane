/**
 * Combat hit / death FX — gameplay events for presentation to draw.
 * Cap pool size for mobile FPS.
 */
import type { BattlefieldWorld } from './battlefieldWorld';

export type CombatFxKind =
  | 'hit'
  | 'death'
  | 'building_hit'
  | 'core_pulse'
  | 'core_burst';

export interface CombatFx {
  kind: CombatFxKind;
  x: number;
  y: number;
  color: number;
  radius: number;
  lifeMs: number;
  maxLifeMs: number;
  /** Stable-ish scatter seed. */
  seed: number;
}

/** Cap pops so mid-match spam stays mobile-friendly. */
const MAX_FX = 32;

export function ensureCombatFx(world: BattlefieldWorld): void {
  if (!world.combatFx) world.combatFx = [];
}

export function pushCombatFx(
  world: BattlefieldWorld,
  kind: CombatFxKind,
  x: number,
  y: number,
  color: number,
  radius: number,
  lifeMs: number,
): void {
  ensureCombatFx(world);
  const list = world.combatFx;
  if (list.length >= MAX_FX) list.shift();
  list.push({
    kind,
    x,
    y,
    color,
    radius,
    lifeMs,
    maxLifeMs: lifeMs,
    seed: (x * 13 + y * 7 + list.length * 17) | 0,
  });
}

export function spawnHitFx(
  world: BattlefieldWorld,
  x: number,
  y: number,
  radius: number,
  teamColor: number,
): void {
  pushCombatFx(world, 'hit', x, y, teamColor, Math.max(10, radius * 0.9), 180);
}

export function spawnBuildingHitFx(
  world: BattlefieldWorld,
  x: number,
  y: number,
  radius: number,
): void {
  pushCombatFx(world, 'building_hit', x, y, 0xf0c75e, radius * 0.7, 200);
}

export function spawnDeathFx(
  world: BattlefieldWorld,
  x: number,
  y: number,
  radius: number,
  color: number,
): void {
  pushCombatFx(world, 'death', x, y, color, Math.max(14, radius * 1.2), 420);
}

export function tickCombatFx(world: BattlefieldWorld, dtMs: number): void {
  ensureCombatFx(world);
  const list = world.combatFx;
  for (let i = list.length - 1; i >= 0; i--) {
    const fx = list[i]!;
    fx.lifeMs -= dtMs;
    if (fx.lifeMs <= 0) list.splice(i, 1);
  }
}
