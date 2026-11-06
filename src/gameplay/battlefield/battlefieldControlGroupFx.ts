/**
 * Control-group assign/recall FX — brief rings when Ctrl+# / # fire.
 */
import type { BattlefieldWorld } from './battlefieldWorld';
import { selectedUnits } from './battlefieldWorld';

export type ControlGroupFxKind = 'assign' | 'recall';

export interface ControlGroupFx {
  kind: ControlGroupFxKind;
  slot: number;
  x: number;
  y: number;
  radius: number;
  color: number;
  lifeMs: number;
  maxLifeMs: number;
}

const MAX_FX = 28;
const LIFE_MS = 380;

export function ensureControlGroupFx(world: BattlefieldWorld): void {
  if (!world.controlGroupFx) world.controlGroupFx = [];
}

function pushUnitPulses(
  world: BattlefieldWorld,
  kind: ControlGroupFxKind,
  slot: number,
  color: number,
): number {
  ensureControlGroupFx(world);
  const list = world.controlGroupFx;
  let n = 0;
  for (const u of selectedUnits(world)) {
    if (list.length >= MAX_FX) list.shift();
    list.push({
      kind,
      slot,
      x: u.x,
      y: u.y,
      radius: u.radius + (kind === 'assign' ? 12 : 14),
      color,
      lifeMs: LIFE_MS,
      maxLifeMs: LIFE_MS,
    });
    n++;
  }
  return n;
}

/** Ctrl+# — brace flash on newly grouped units. */
export function spawnControlGroupAssignFx(
  world: BattlefieldWorld,
  slot: number,
): number {
  return pushUnitPulses(world, 'assign', slot, 0x6ecfbf);
}

/** # — select flash on recalled group. */
export function spawnControlGroupRecallFx(
  world: BattlefieldWorld,
  slot: number,
): number {
  return pushUnitPulses(world, 'recall', slot, 0xf0c75e);
}

export function tickControlGroupFx(
  world: BattlefieldWorld,
  dtMs: number,
): void {
  ensureControlGroupFx(world);
  const list = world.controlGroupFx;
  for (let i = list.length - 1; i >= 0; i--) {
    const fx = list[i]!;
    fx.lifeMs -= dtMs;
    if (fx.lifeMs <= 0) list.splice(i, 1);
  }
}
