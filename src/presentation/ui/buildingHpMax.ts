/**
 * Catalog building max-HP tip (HUD label only).
 * Format: Max HP · {n} — same key as unit tip; distinct from HP · pct%.
 */
import { getBuildingType, type BuildingTypeId } from '../../data/buildings';
import { t } from '../../i18n';

export function buildingHpMax(typeId: BuildingTypeId): number | null {
  const n = getBuildingType(typeId).maxHp;
  return n > 0 ? n : null;
}

export function buildingHpMaxLabel(typeId: BuildingTypeId): string | null {
  const n = buildingHpMax(typeId);
  return n == null ? null : t('sel.hpMaxTip', { n });
}
