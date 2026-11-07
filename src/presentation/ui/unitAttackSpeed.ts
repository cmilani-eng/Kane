/**
 * Catalog attack-speed tip (HUD label only).
 * Format: Rate · {n}/s — middot (U+00B7); attacks per second from
 * attackCooldownMs.
 * Distinct from Atk CD · / DPS · / Heal · / Damage · / Speed · / Pace ·
 * peers. Buildings / non-attack units omit.
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Attacks per second, one decimal. Null if no attack. */
export function attackSpeedPerSec(cooldownMs: number): number | null {
  if (cooldownMs <= 0) return null;
  return Math.round((1000 / cooldownMs) * 10) / 10;
}

export function unitAttackSpeed(typeId: UnitTypeId): number | null {
  const def = getUnitType(typeId);
  if (def.dmg <= 0) return null;
  return attackSpeedPerSec(def.attackCooldownMs);
}

export function unitAttackSpeedLabel(typeId: UnitTypeId): string | null {
  const n = unitAttackSpeed(typeId);
  return n == null ? null : t('sel.atkSpeedTip', { n });
}

/** Shared attack-speed tip when every selected unit is the same type. */
export function sharedUnitAttackSpeedLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitAttackSpeedLabel(first);
}
