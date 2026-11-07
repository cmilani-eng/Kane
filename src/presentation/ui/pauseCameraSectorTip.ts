/**
 * Pause overlay camera sector tip (HUD label only).
 * Format: Cam · {sector} — view-center 3×3 frozen at pause open.
 * Distinct from Focus · / Hero · / Selected · / Scout ·; same copy as
 * minimap Cam tip but own pause-scoped key (`pause.camSectorTip`).
 */
import type { MapSectorId } from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';
import { minimapCameraSectorAt } from './minimapCameraSectorTip';

export { minimapCameraSectorAt as pauseCameraSectorAt };

/** Cam · {sector} — view-center 3×3 sector when pause opened. */
export function pauseCameraSectorTipLine(sector: MapSectorId): string {
  return t('pause.camSectorTip', { sector });
}
