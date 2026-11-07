/**
 * Catalog projectile-speed tip for ranged units (HUD label only).
 * Format: Proj · {n} — middot (U+00B7); tiles/s from COMBAT.projectileSpeed.
 * Distinct from Atk CD · / Splash · / Atk · type tips (and move Speed ·).
 */
import { COMBAT, MAP } from '../../config/balance';
import type { UnitTypeId } from '../../data/units';
import { t } from '../../i18n';
import { unitAttackType } from './unitAttackType';

/** Tiles/s from world-pixel projectile speed, one decimal. Null if none. */
export function projectileSpeedTilesPerSec(speedPx: number): number | null {
  if (speedPx <= 0) return null;
  return Math.round((speedPx / MAP.tile) * 10) / 10;
}

/** Catalog projectile speed in tiles/s. Null for melee / non-attacking units. */
export function unitProjectileSpeed(typeId: UnitTypeId): number | null {
  if (unitAttackType(typeId) !== 'ranged') return null;
  return projectileSpeedTilesPerSec(COMBAT.projectileSpeed);
}

export function unitProjectileSpeedLabel(typeId: UnitTypeId): string | null {
  const n = unitProjectileSpeed(typeId);
  return n == null ? null : t('sel.projTip', { n });
}

/** Shared tip when every selected unit matches projectile tiles/s. */
export function sharedUnitProjectileSpeedLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitProjectileSpeed(typeIds[0]!);
  if (first == null) return null;
  for (let i = 1; i < typeIds.length; i++) {
    if (unitProjectileSpeed(typeIds[i]!) !== first) return null;
  }
  return unitProjectileSpeedLabel(typeIds[0]!);
}
