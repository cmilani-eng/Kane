/**
 * Unit armor-class tip for selection stats (HUD label only).
 * Distinct from building Armor · Structure and from coarse duty role tip.
 */
import { unitArmorClass } from '../../data/unitArmorClass';
import type { UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

export function unitArmorClassTipLabel(typeId: UnitTypeId): string {
  const role = unitArmorClass(typeId);
  return t('sel.armorTip', { role: t(`sel.armor.${role}`) });
}

/** Shared armor-class tip when every selected unit shares one class. */
export function sharedUnitArmorClassTipLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitArmorClass(typeIds[0]!);
  for (let i = 1; i < typeIds.length; i++) {
    if (unitArmorClass(typeIds[i]!) !== first) return null;
  }
  return unitArmorClassTipLabel(typeIds[0]!);
}
