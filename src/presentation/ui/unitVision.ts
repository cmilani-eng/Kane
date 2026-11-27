/**
 * Catalog vision/sight-radius tip in map tiles (HUD label only).
 * Format: Sight · {n} (middot U+00B7) — distinct from Range · /
 * Speed · / Proj ·, and from minimap/end Vision · tips.
 * Buildings omit (no catalog vision radius).
 */
import { MAP } from '../../config/balance';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Whole-number tile vision from world-pixel radius. */
export function visionTiles(visionPx: number): number {
  if (visionPx <= 0) return 0;
  return Math.max(0, Math.round(visionPx / MAP.tile));
}

export function unitVision(typeId: UnitTypeId): number | null {
  const v = getUnitType(typeId).vision;
  if (v <= 0) return null;
  return visionTiles(v);
}

export function unitVisionLabel(typeId: UnitTypeId): string | null {
  const n = unitVision(typeId);
  return n == null ? null : t('sel.visionTip', { n });
}

/** Shared vision label when every selected unit is the same type. */
export function sharedUnitVisionLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitVisionLabel(first);
}
