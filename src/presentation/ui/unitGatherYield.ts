/**
 * Catalog gather-yield tip for workers (HUD label only).
 * Carry capacity per trip — distinct from live cargo and node gather tips.
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Catalog haul per trip. Null when the unit cannot gather. */
export function unitGatherYield(typeId: UnitTypeId): number | null {
  const def = getUnitType(typeId);
  if (!def.canGather || def.carryCapacity <= 0) return null;
  return def.carryCapacity;
}

export function unitGatherYieldLabel(typeId: UnitTypeId): string | null {
  const n = unitGatherYield(typeId);
  return n == null ? null : t('sel.yieldTip', { n });
}

/** Shared yield tip when every selected unit matches haul capacity. */
export function sharedUnitGatherYieldLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitGatherYield(typeIds[0]!);
  if (first == null) return null;
  for (let i = 1; i < typeIds.length; i++) {
    if (unitGatherYield(typeIds[i]!) !== first) return null;
  }
  return unitGatherYieldLabel(typeIds[0]!);
}
