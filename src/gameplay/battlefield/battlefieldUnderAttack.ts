/**
 * Under-attack alert — gameplay cue when player friendlies take enemy damage.
 * Presentation draws edge flash + soft camera nudge; optional SFX.
 */
import type { BattlefieldWorld } from './battlefieldWorld';

export interface UnderAttackAlert {
  lifeMs: number;
  maxLifeMs: number;
  /** World position of the hit (for camera nudge). */
  x: number;
  y: number;
  /** Remaining cooldown before another pulse (SFX / nudge). */
  cooldownMs: number;
  /** True for one sim frame when a new pulse fires. */
  pulse: boolean;
}

const ALERT_LIFE_MS = 520;
/** Soft rate-limit so melee spam does not strobe the HUD. */
const PULSE_COOLDOWN_MS = 850;

export function createUnderAttackAlert(): UnderAttackAlert {
  return {
    lifeMs: 0,
    maxLifeMs: ALERT_LIFE_MS,
    x: 0,
    y: 0,
    cooldownMs: 0,
    pulse: false,
  };
}

export function ensureUnderAttackAlert(world: BattlefieldWorld): void {
  if (!world.underAttackAlert) {
    world.underAttackAlert = createUnderAttackAlert();
  }
}

/** Call when a player unit or building takes damage from an enemy. */
export function notifyUnderAttack(
  world: BattlefieldWorld,
  x: number,
  y: number,
): void {
  ensureUnderAttackAlert(world);
  const a = world.underAttackAlert;
  a.x = x;
  a.y = y;
  a.lifeMs = ALERT_LIFE_MS;
  a.maxLifeMs = ALERT_LIFE_MS;
  if (a.cooldownMs <= 0) {
    a.pulse = true;
    a.cooldownMs = PULSE_COOLDOWN_MS;
  }
}

export function tickUnderAttackAlert(
  world: BattlefieldWorld,
  dtMs: number,
): void {
  ensureUnderAttackAlert(world);
  const a = world.underAttackAlert;
  if (a.lifeMs > 0) {
    a.lifeMs = Math.max(0, a.lifeMs - dtMs);
  }
  if (a.cooldownMs > 0) {
    a.cooldownMs = Math.max(0, a.cooldownMs - dtMs);
  }
  // Pulse is sticky until presentation consumes it (same frame).
}
