/**
 * Glanceable building armor class for selection HUD.
 * Labels only — does not change combat math.
 */
import type { BuildingTypeId } from './buildings';

export type BuildingArmorClassId = 'structure';

/** Armor class for a building type (HUD only). */
export function buildingArmorClass(
  _typeId: BuildingTypeId,
): BuildingArmorClassId {
  return 'structure';
}
