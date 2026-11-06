/**
 * Minimap camera-frame sector tip (presentation only).
 * Distinct from the static View mark — shows 3×3 sector of the view center.
 */
import {
  mapSectorAt,
  type MapSectorId,
} from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';

/** 3×3 sector under the camera viewport center. */
export function minimapCameraSectorAt(
  scrollX: number,
  scrollY: number,
  viewW: number,
  viewH: number,
): MapSectorId {
  return mapSectorAt(scrollX + viewW / 2, scrollY + viewH / 2);
}

export function minimapCameraSectorTipText(sector: MapSectorId): string {
  return t('hud.minimapCamSector', { sector });
}
