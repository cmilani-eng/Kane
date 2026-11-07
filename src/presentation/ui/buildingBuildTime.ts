/**
 * Catalog building full build-time tip in whole seconds (HUD label only).
 * Format: Build · {n}s — distinct from live construction remaining / progress tips.
 */
import { getBuildingType, type BuildingTypeId } from '../../data/buildings';
import { t } from '../../i18n';

/** Full build duration in whole seconds (ceil of buildMs). Null if none. */
export function buildingBuildTimeSec(typeId: BuildingTypeId): number | null {
  const ms = getBuildingType(typeId).buildMs;
  if (ms <= 0) return null;
  return Math.max(1, Math.ceil(ms / 1000));
}

export function buildingBuildTimeLabel(typeId: BuildingTypeId): string | null {
  const n = buildingBuildTimeSec(typeId);
  return n == null ? null : t('sel.buildTimeTip', { n });
}
