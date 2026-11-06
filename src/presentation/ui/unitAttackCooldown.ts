/**
 * Catalog attack-cooldown tip in seconds (HUD label only).
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Attack interval in seconds, one decimal. Null if no attack. */
export function attackCooldownSec(cooldownMs: number): number | null {
  if (cooldownMs <= 0) return null;
  return Math.round(cooldownMs / 100) / 10;
}

export function unitAttackCooldown(typeId: UnitTypeId): number | null {
  const def = getUnitType(typeId);
  if (def.dmg <= 0) return null;
  return attackCooldownSec(def.attackCooldownMs);
}

export function unitAttackCooldownLabel(typeId: UnitTypeId): string | null {
  const n = unitAttackCooldown(typeId);
  return n == null ? null : t('sel.atkCdTip', { n });
}

/** Shared attack-CD label when every selected unit is the same type. */
export function sharedUnitAttackCooldownLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitAttackCooldownLabel(first);
}
