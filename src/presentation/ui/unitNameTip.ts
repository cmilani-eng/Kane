/**
 * Catalog unit-name tip (HUD label only).
 */
import type { UnitTypeId } from '../../data/units';
import { t, unitDisplayName } from '../../i18n';

export function unitNameTipLabel(typeId: UnitTypeId): string {
  return t('sel.nameTip', { name: unitDisplayName(typeId) });
}

/** Shared name tip when every selected unit is the same type. */
export function sharedUnitNameTipLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = typeIds[0]!;
  for (let i = 1; i < typeIds.length; i++) {
    if (typeIds[i] !== first) return null;
  }
  return unitNameTipLabel(first);
}
