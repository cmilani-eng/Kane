/**
 * Catalog max-HP tip (HUD label only).
 * Format: Max HP · {n} — distinct from live HP · pct% and HP chip.
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

export function unitHpMax(typeId: UnitTypeId): number | null {
  const n = getUnitType(typeId).maxHp;
  return n > 0 ? n : null;
}

export function unitHpMaxLabel(typeId: UnitTypeId): string | null {
  const n = unitHpMax(typeId);
  return n == null ? null : t('sel.hpMaxTip', { n });
}

/** Shared max-HP label when every selected unit is the same type. */
export function sharedUnitHpMaxLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitHpMaxLabel(first);
}
