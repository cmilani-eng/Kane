/**
 * Pause overlay selected-unit sector tip (HUD label only).
 * Centroid of living player selection → 3×3 map sector, frozen at open.
 * Distinct from Cam · sector and Selected · n tips.
 */
import {
  mapSectorAt,
  type MapSectorId,
} from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';

export type PauseSelectablePoint = { x: number; y: number };

/** Null when selection is empty. */
export function pauseSelectedSectorAt(
  points: readonly PauseSelectablePoint[],
): MapSectorId | null {
  if (points.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  const n = points.length;
  return mapSectorAt(sx / n, sy / n);
}

/** Focus · {sector} — selection centroid sector when pause opened. */
export function pauseSelectedSectorTipLine(sector: MapSectorId): string {
  return t('pause.selectedSectorTip', { sector });
}
