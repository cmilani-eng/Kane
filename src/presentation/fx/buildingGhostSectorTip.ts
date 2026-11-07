/**
 * Fog ghost last-seen sector tip (HUD label only).
 * Distinct from the age chip (`hud.ghostAge`).
 */
import {
  mapSectorAt,
  type MapSectorId,
} from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';

export function buildingGhostSectorAt(x: number, y: number): MapSectorId {
  return mapSectorAt(x, y);
}

/** 3×3 sector tip for an active leave-vision ghost. */
export function buildingGhostSectorTip(x: number, y: number): string {
  return t('hud.ghostSector', { sector: buildingGhostSectorAt(x, y) });
}
