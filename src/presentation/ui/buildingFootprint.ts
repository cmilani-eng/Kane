/**
 * Catalog building footprint tip in tile w×h (HUD label only).
 * Same size as placement ghost; distinct from the place-strip chip.
 */
import type { BuildingTypeId } from '../../data/buildings';
import { t } from '../../i18n';
import { placementFootprintSize } from '../buildings/placementGhost';

export function buildingFootprintSize(typeId: BuildingTypeId): {
  w: number;
  h: number;
} {
  const { cols, rows } = placementFootprintSize(typeId);
  return { w: cols, h: rows };
}

export function buildingFootprintLabel(typeId: BuildingTypeId): string {
  const { w, h } = buildingFootprintSize(typeId);
  return t('sel.footprintTip', { w, h });
}
