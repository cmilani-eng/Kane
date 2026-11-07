/**
 * Pause overlay camera sector tip (HUD label only).
 * Distinct from minimap Cam · sector mark — frozen at pause open.
 */
import type { MapSectorId } from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';
import { minimapCameraSectorAt } from './minimapCameraSectorTip';

export { minimapCameraSectorAt as pauseCameraSectorAt };

/** Cam · {sector} — view-center 3×3 sector when pause opened. */
export function pauseCameraSectorTipLine(sector: MapSectorId): string {
  return t('pause.camSectorTip', { sector });
}
