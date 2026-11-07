/**
 * Catalog attack-range tip in map tiles (HUD label only).
 */
import { MAP } from '../../config/balance';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Whole-number tile reach from world-pixel attack range. */
export function attackRangeTiles(rangePx: number): number {
  if (rangePx <= 0) return 0;
  return Math.max(0, Math.round(rangePx / MAP.tile));
}

export function attackRangeLabel(rangePx: number): string | null {
  if (rangePx <= 0) return null;
  return t('sel.rangeTip', { n: attackRangeTiles(rangePx) });
}

/** Catalog attack range in map tiles. Null when the unit cannot attack. */
export function unitAttackRange(typeId: UnitTypeId): number | null {
  const r = getUnitType(typeId).range;
  if (r <= 0) return null;
  return attackRangeTiles(r);
}

export function unitAttackRangeLabel(typeId: UnitTypeId): string | null {
  const n = unitAttackRange(typeId);
  return n == null ? null : t('sel.rangeTip', { n });
}

/** Shared range tip when every selected unit matches. */
export function sharedUnitAttackRangeLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitAttackRange(typeIds[0]!);
  if (first == null) return null;
  for (let i = 1; i < typeIds.length; i++) {
    if (unitAttackRange(typeIds[i]!) !== first) return null;
  }
  return unitAttackRangeLabel(typeIds[0]!);
}
