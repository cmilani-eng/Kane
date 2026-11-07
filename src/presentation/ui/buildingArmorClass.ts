/**
 * Building armor-class tip (HUD label only).
 */
import type { BuildingTypeId } from '../../data/buildings';
import { buildingArmorClass } from '../../data/buildingArmorClass';
import { t } from '../../i18n';

export function buildingArmorClassLabel(typeId: BuildingTypeId): string {
  const role = buildingArmorClass(typeId);
  // Same Armor · {type} tip key as units (Structure), distinct from Armor · {n}.
  return t('sel.armorTip', { role: t(`sel.armor.${role}`) });
}
