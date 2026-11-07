/**
 * Catalog weapon/attack-type tip — Melee vs Ranged (HUD label only).
 * Format: Atk · {type} — middot (U+00B7).
 * Distinct from Damage · / DPS · / Atk CD · tips (and range / armor).
 */
import { MAP } from '../../config/balance';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

export type UnitAttackTypeId = 'melee' | 'ranged';

/** Melee when reach is within one tile; otherwise Ranged. Null if no attack. */
export function unitAttackType(typeId: UnitTypeId): UnitAttackTypeId | null {
  const def = getUnitType(typeId);
  if (def.dmg <= 0 || def.range <= 0) return null;
  return def.range > MAP.tile ? 'ranged' : 'melee';
}

export function unitAttackTypeLabel(typeId: UnitTypeId): string | null {
  const kind = unitAttackType(typeId);
  return kind == null
    ? null
    : t('sel.atkTypeTip', { type: t(`sel.atkType.${kind}`) });
}

/** Shared tip when every selected unit shares one attack type. */
export function sharedUnitAttackTypeLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitAttackType(typeIds[0]!);
  if (first == null) return null;
  for (let i = 1; i < typeIds.length; i++) {
    if (unitAttackType(typeIds[i]!) !== first) return null;
  }
  return unitAttackTypeLabel(typeIds[0]!);
}
