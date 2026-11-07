/**
 * Catalog train-duration tip in whole seconds (HUD label only).
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Full train duration in whole seconds (ceil of trainMs). Null if none. */
export function unitTrainDurationSec(typeId: UnitTypeId): number | null {
  const ms = getUnitType(typeId).trainMs;
  if (ms <= 0) return null;
  return Math.max(1, Math.ceil(ms / 1000));
}

export function unitTrainDurationLabel(typeId: UnitTypeId): string | null {
  const n = unitTrainDurationSec(typeId);
  return n == null ? null : t('sel.trainDurationTip', { n });
}

/** Shared train-duration label when every selected unit is the same type. */
export function sharedUnitTrainDurationLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitTrainDurationLabel(first);
}
