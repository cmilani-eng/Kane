/**
 * Catalog cargo-capacity tip for workers (HUD label only).
 * Max haul slots — distinct from Yield · n per trip and live cargo line.
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Catalog max cargo. Null when the unit cannot gather. */
export function unitCargoCapacity(typeId: UnitTypeId): number | null {
  const def = getUnitType(typeId);
  if (!def.canGather || def.carryCapacity <= 0) return null;
  return def.carryCapacity;
}

export function unitCargoCapacityLabel(typeId: UnitTypeId): string | null {
  const n = unitCargoCapacity(typeId);
  return n == null ? null : t('sel.cargoCapTip', { n });
}

/** Shared cargo tip when every selected unit matches capacity. */
export function sharedUnitCargoCapacityLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitCargoCapacity(typeIds[0]!);
  if (first == null) return null;
  for (let i = 1; i < typeIds.length; i++) {
    if (unitCargoCapacity(typeIds[i]!) !== first) return null;
  }
  return unitCargoCapacityLabel(typeIds[0]!);
}
