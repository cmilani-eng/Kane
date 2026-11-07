/**
 * Idle military detection — combat units standing still with no attack target.
 * Presentation mirrors the idle-worker HUD chip (select all → cycle + camera).
 */
import { attackDirectionArrow } from './attackDirection';
import type {
  BattlefieldUnit,
  BattlefieldWorld,
} from './battlefieldWorld';
import { clearSelection } from './battlefieldWorld';
import { isMilitaryUnit } from './selectMilitary';

/** Living player combat unit with nothing to do right now. */
export function isIdleMilitary(u: BattlefieldUnit): boolean {
  if (!isMilitaryUnit(u)) return false;
  if (u.attackTargetId != null) return false;
  if (u.moveTarget != null || u.path.length > 0) return false;
  return true;
}

export function listIdleMilitary(world: BattlefieldWorld): BattlefieldUnit[] {
  return world.units.filter(isIdleMilitary).sort((a, b) => a.id - b.id);
}

export function countIdleMilitary(world: BattlefieldWorld): number {
  let n = 0;
  for (const u of world.units) {
    if (isIdleMilitary(u)) n++;
  }
  return n;
}

/**
 * 8-way arrow from idle-army centroid toward the nearest living enemy unit.
 * HUD tip only — does not acquire or issue orders. Null when no idles/enemies.
 */
export function nearestIdleArmyThreatArrow(
  world: BattlefieldWorld,
): string | null {
  const idles = listIdleMilitary(world);
  if (idles.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const u of idles) {
    sx += u.x;
    sy += u.y;
  }
  const cx = sx / idles.length;
  const cy = sy / idles.length;

  let best: { x: number; y: number; d2: number } | null = null;
  for (const u of world.units) {
    if (u.team !== 'enemy' || u.hp <= 0) continue;
    const dx = u.x - cx;
    const dy = u.y - cy;
    const d2 = dx * dx + dy * dy;
    if (!best || d2 < best.d2) best = { x: u.x, y: u.y, d2 };
  }
  if (!best) return null;
  return attackDirectionArrow(cx, cy, best.x, best.y);
}

export type IdleMilitaryChipResult = {
  count: number;
  mode: 'all' | 'cycle';
  /** Focus unit for camera (first of all, or the cycled one). */
  focus: BattlefieldUnit | null;
};

/**
 * Idle-army chip: first tap selects all idle military; further taps cycle one-by-one.
 */
export function selectOrCycleIdleMilitary(
  world: BattlefieldWorld,
): IdleMilitaryChipResult {
  const idles = listIdleMilitary(world);
  if (idles.length === 0) {
    return { count: 0, mode: 'all', focus: null };
  }

  const anyIdleSelected = idles.some((u) => u.selected);
  if (!anyIdleSelected) {
    clearSelection(world);
    for (const u of idles) u.selected = true;
    return { count: idles.length, mode: 'all', focus: idles[0] ?? null };
  }

  let last = -1;
  for (let i = 0; i < idles.length; i++) {
    if (idles[i]!.selected) last = i;
  }
  const next = idles[(last + 1) % idles.length]!;
  clearSelection(world);
  next.selected = true;
  return { count: 1, mode: 'cycle', focus: next };
}
