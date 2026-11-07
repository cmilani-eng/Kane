/**
 * Selection panel catalog move-speed tip (HUD label only).
 * Format: Speed · {n} (tiles/s numeric; distinct from Pace · cadence and
 * Rate · attack-speed tips).
 */
import { MAP } from '../../config/balance';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Tiles/s from world-pixel speed, one decimal. Null if no move. */
export function moveSpeedTilesPerSec(speedPx: number): number | null {
  if (speedPx <= 0) return null;
  return Math.round((speedPx / MAP.tile) * 10) / 10;
}

export function unitMoveSpeed(typeId: UnitTypeId): number | null {
  return moveSpeedTilesPerSec(getUnitType(typeId).speed);
}

export function unitMoveSpeedLabel(typeId: UnitTypeId): string | null {
  const n = unitMoveSpeed(typeId);
  return n == null ? null : t('sel.speedTip', { n });
}

/** Shared speed label when every selected unit is the same type. */
export function sharedUnitMoveSpeedLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitMoveSpeedLabel(first);
}
