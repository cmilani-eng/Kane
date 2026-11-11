/**
 * Catalog DPS tip from unit type dmg / attack cooldown (HUD label only).
 * Format: DPS · {n} — middot (U+00B7).
 * Distinct from Atk CD · / Proj · / Splash · / Range · (and Damage · / Rate ·).
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Whole-number DPS = round(dmg * 1000 / attackCooldownMs). Null if no attack. */
export function unitDps(typeId: UnitTypeId): number | null {
  const def = getUnitType(typeId);
  if (def.dmg <= 0 || def.attackCooldownMs <= 0) return null;
  return Math.round((def.dmg * 1000) / def.attackCooldownMs);
}

export function unitDpsLabel(typeId: UnitTypeId): string | null {
  const n = unitDps(typeId);
  return n == null ? null : t('sel.dps', { n });
}

/** Shared DPS label when every selected unit is the same type. */
export function sharedUnitDpsLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitDpsLabel(first);
}
