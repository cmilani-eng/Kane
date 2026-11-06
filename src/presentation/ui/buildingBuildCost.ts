/**
 * Catalog building build-cost tip (HUD label only).
 */
import { getBuildingType, type BuildingTypeId } from '../../data/buildings';
import { t } from '../../i18n';

export function buildingBuildCostLabel(typeId: BuildingTypeId): string | null {
  const cost = getBuildingType(typeId).cost;
  const gold = cost.gold ?? 0;
  const crystals = cost.magic_crystals ?? 0;
  if (gold <= 0 && crystals <= 0) return null;
  if (crystals > 0) {
    return t('sel.buildCostBoth', { gold, crystals });
  }
  return t('sel.buildCostGold', { gold });
}
