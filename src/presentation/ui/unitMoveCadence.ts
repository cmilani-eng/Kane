/**
 * Catalog move-cadence tip — Slow / Medium / Fast bucket (HUD label only).
 * Distinct from the numeric tiles/s speed tip.
 */
import type { UnitTypeId } from '../../data/units';
import { t } from '../../i18n';
import { unitMoveSpeed } from './unitMoveSpeed';

export type MoveCadenceId = 'slow' | 'medium' | 'fast';

/**
 * Bucket from tiles/s: Slow < 2.0, Fast ≥ 2.8, else Medium.
 * Null when the unit cannot move.
 */
export function moveCadenceBucket(
  tilesPerSec: number | null,
): MoveCadenceId | null {
  if (tilesPerSec == null || tilesPerSec <= 0) return null;
  if (tilesPerSec < 2) return 'slow';
  if (tilesPerSec >= 2.8) return 'fast';
  return 'medium';
}

export function unitMoveCadence(typeId: UnitTypeId): MoveCadenceId | null {
  return moveCadenceBucket(unitMoveSpeed(typeId));
}

export function unitMoveCadenceLabel(typeId: UnitTypeId): string | null {
  const bucket = unitMoveCadence(typeId);
  return bucket == null
    ? null
    : t('sel.moveCadenceTip', { pace: t(`sel.moveCadence.${bucket}`) });
}

/** Shared cadence tip when every selected unit shares one pace bucket. */
export function sharedUnitMoveCadenceLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitMoveCadence(typeIds[0]!);
  if (first == null) return null;
  for (let i = 1; i < typeIds.length; i++) {
    if (unitMoveCadence(typeIds[i]!) !== first) return null;
  }
  return unitMoveCadenceLabel(typeIds[0]!);
}
