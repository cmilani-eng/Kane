/**
 * Catalog train crystal-cost tip (HUD label only).
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

export function unitTrainCrystal(typeId: UnitTypeId): number | null {
  const n = getUnitType(typeId).costCrystals;
  return n > 0 ? n : null;
}

export function unitTrainCrystalLabel(typeId: UnitTypeId): string | null {
  const n = unitTrainCrystal(typeId);
  return n == null ? null : t('sel.trainCrystalTip', { n });
}

/** Shared train-crystal label when every selected unit is the same type. */
export function sharedUnitTrainCrystalLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitTrainCrystalLabel(first);
}
