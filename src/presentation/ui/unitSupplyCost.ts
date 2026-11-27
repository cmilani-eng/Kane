/**
 * Catalog supply-cost tip (HUD label only).
 * Format: Supply · {n} — middot (U+00B7); one slot per living unit (`livingByTeam` / unitCap).
 * Distinct from Max HP · / DPS · / Range ·. Buildings do not consume supply slots.
 */
import type { UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Supply slots each unit occupies toward the match cap. */
export const UNIT_SUPPLY_COST = 1;

export function unitSupplyCost(_typeId: UnitTypeId): number {
  return UNIT_SUPPLY_COST;
}

export function unitSupplyCostLabel(typeId: UnitTypeId): string {
  return t('sel.supplyTip', { n: unitSupplyCost(typeId) });
}

/** Shared supply label when every selected unit is the same type. */
export function sharedUnitSupplyCostLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitSupplyCostLabel(first);
}
