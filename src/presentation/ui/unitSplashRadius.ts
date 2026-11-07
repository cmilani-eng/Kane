/**
 * Catalog splash / AoE attack-radius tip in map tiles (HUD label only).
 * Format: Splash · {n} — middot (U+00B7).
 * Distinct from Range · / Damage · / Atk · type tips.
 */
import { MAP } from '../../config/balance';
import { unitSplashRadiusPx } from '../../data/unitSplashRadius';
import type { UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Whole-number tile splash from world-pixel radius. */
export function splashRadiusTiles(radiusPx: number): number {
  if (radiusPx <= 0) return 0;
  return Math.max(0, Math.round(radiusPx / MAP.tile));
}

/** Catalog splash radius in map tiles. Null when the unit has no splash. */
export function unitSplashRadius(typeId: UnitTypeId): number | null {
  const px = unitSplashRadiusPx(typeId);
  if (px == null) return null;
  const n = splashRadiusTiles(px);
  return n > 0 ? n : null;
}

export function unitSplashRadiusLabel(typeId: UnitTypeId): string | null {
  const n = unitSplashRadius(typeId);
  return n == null ? null : t('sel.splashTip', { n });
}

/** Shared splash tip when every selected unit matches. */
export function sharedUnitSplashRadiusLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitSplashRadius(typeIds[0]!);
  if (first == null) return null;
  for (let i = 1; i < typeIds.length; i++) {
    if (unitSplashRadius(typeIds[i]!) !== first) return null;
  }
  return unitSplashRadiusLabel(typeIds[0]!);
}
