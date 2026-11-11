/**
 * Catalog attack-damage tip (HUD label only).
 * Format: Damage · {n} — middot (U+00B7).
 * Distinct from DPS · / Atk CD · / Splash · / Range · peers and from
 * the ATK inline chip.
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

export function unitDamage(typeId: UnitTypeId): number | null {
  const n = getUnitType(typeId).dmg;
  return n > 0 ? n : null;
}

export function unitDamageLabel(typeId: UnitTypeId): string | null {
  const n = unitDamage(typeId);
  return n == null ? null : t('sel.dmgTip', { n });
}

/** Shared damage tip when every selected unit is the same type. */
export function sharedUnitDamageLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitDamageLabel(first);
}
