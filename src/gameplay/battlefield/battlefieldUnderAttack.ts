/**
 * Under-attack alert — gameplay cue when player friendlies take enemy damage.
 * Presentation draws edge flash + soft camera nudge; optional SFX / HUD chip.
 */
import type { BattlefieldWorld } from './battlefieldWorld';

export type UnderAttackSeverity = 'normal' | 'critical';
export type UnderAttackKind = 'unit' | 'keep' | 'hero';

export interface UnderAttackAlert {
  lifeMs: number;
  maxLifeMs: number;
  /** World position of the hit (for camera nudge / chip jump). */
  x: number;
  y: number;
  /** Remaining cooldown before another pulse (SFX / nudge). */
  cooldownMs: number;
  /** True for one sim frame when a new pulse fires. */
  pulse: boolean;
  /** Keep/hero hits escalate the flash + chip. */
  severity: UnderAttackSeverity;
  kind: UnderAttackKind;
}

const ALERT_LIFE_MS = 520;
const CRITICAL_LIFE_MS = 980;
/** Soft rate-limit so melee spam does not strobe the HUD. */
const PULSE_COOLDOWN_MS = 850;
/** Critical keep/hero can re-pulse sooner. */
const CRITICAL_PULSE_COOLDOWN_MS = 420;

export function createUnderAttackAlert(): UnderAttackAlert {
  return {
    lifeMs: 0,
    maxLifeMs: ALERT_LIFE_MS,
    x: 0,
    y: 0,
    cooldownMs: 0,
    pulse: false,
    severity: 'normal',
    kind: 'unit',
  };
}

export function ensureUnderAttackAlert(world: BattlefieldWorld): void {
  if (!world.underAttackAlert) {
    world.underAttackAlert = createUnderAttackAlert();
  }
  const a = world.underAttackAlert;
  if (a.severity == null) a.severity = 'normal';
  if (a.kind == null) a.kind = 'unit';
}

/** Call when a player unit or building takes damage from an enemy. */
export function notifyUnderAttack(
  world: BattlefieldWorld,
  x: number,
  y: number,
  opts?: { severity?: UnderAttackSeverity; kind?: UnderAttackKind },
): void {
  ensureUnderAttackAlert(world);
  const a = world.underAttackAlert;
  const severity = opts?.severity ?? 'normal';
  const kind = opts?.kind ?? 'unit';
  const critical = severity === 'critical';

  a.x = x;
  a.y = y;
  // Never downgrade an active critical flash to normal mid-fight.
  if (critical) {
    a.severity = 'critical';
    a.kind = kind;
  } else if (a.lifeMs <= 0 || a.severity !== 'critical') {
    a.severity = 'normal';
    a.kind = kind;
  }

  const life = a.severity === 'critical' ? CRITICAL_LIFE_MS : ALERT_LIFE_MS;
  a.lifeMs = Math.max(a.lifeMs, life);
  a.maxLifeMs = life;

  const canPulse = a.cooldownMs <= 0 || critical;
  if (canPulse) {
    a.pulse = true;
    a.cooldownMs =
      a.severity === 'critical'
        ? CRITICAL_PULSE_COOLDOWN_MS
        : PULSE_COOLDOWN_MS;
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
    if (a.lifeMs <= 0) {
      a.severity = 'normal';
      a.kind = 'unit';
    }
  }
  if (a.cooldownMs > 0) {
    a.cooldownMs = Math.max(0, a.cooldownMs - dtMs);
  }
  // Pulse is sticky until presentation consumes it (same frame).
}
