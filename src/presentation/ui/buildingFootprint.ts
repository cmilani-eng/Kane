/**
 * Catalog building footprint tip in tile w×h (HUD label only).
 * Format: Size · {w}×{h} — middot (U+00B7).
 * Same size as placement ghost; distinct from place-strip chip (`hud.placeFoot`),
 * Build · time / Build · progress / Queue · / Map · size peers.
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
