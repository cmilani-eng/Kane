/**
 * Unit numeric armor tip for selection stats (HUD label only).
 * Format: Armor · {n} — distinct from Armor · {role} class tip.
 */
import { unitArmorValue } from '../../data/unitArmorValue';
import type { UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

export function unitArmorValueLabel(typeId: UnitTypeId): string {
  const n = Math.max(0, Math.floor(unitArmorValue(typeId)));
  return t('sel.armorValueTip', { n });
}

/** Shared armor-value tip when every selected unit shares one catalog value. */
export function sharedUnitArmorValueLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitArmorValue(typeIds[0]!);
  for (let i = 1; i < typeIds.length; i++) {
    if (unitArmorValue(typeIds[i]!) !== first) return null;
  }
  return unitArmorValueLabel(typeIds[0]!);
}
