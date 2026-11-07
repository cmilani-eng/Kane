/**
 * Catalog train gold-cost tip (HUD label only).
 * Format: Gold · {n} — distinct from inline sel.goldCost chip.
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

export function unitTrainGold(typeId: UnitTypeId): number | null {
  const n = getUnitType(typeId).costGold;
  return n > 0 ? n : null;
}

export function unitTrainGoldLabel(typeId: UnitTypeId): string | null {
  const n = unitTrainGold(typeId);
  return n == null ? null : t('sel.trainGoldTip', { n });
}

/** Shared train-gold label when every selected unit is the same type. */
export function sharedUnitTrainGoldLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitTrainGoldLabel(first);
}
