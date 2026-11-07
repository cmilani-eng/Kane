/**
 * Minimap camera-frame sector tip (presentation only).
 * Format: Cam · {sector} — view-center 3×3; middot (U+00B7).
 * Same en/pt-BR/es copy as pause Cam · tip (`pause.camSectorTip` /
 * `pauseCameraSectorTipLine`), distinct key/surface (`hud.minimapCamSector`).
 * Distinct from View mark / Scout · / Focus · chrome chips.
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
