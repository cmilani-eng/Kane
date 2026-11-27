/**
 * Pause overlay selected-unit sector tip (HUD label only).
 * Format: Focus · {sector} — middot (U+00B7); selection centroid 3×3
 * frozen at pause open. Distinct from Cam · / Hero · / Selected · /
 * Scout ·; own pause-scoped key (`pause.selectedSectorTip`).
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

/** Focus · {sector} (U+00B7) — selection centroid sector when pause opened. */
export function pauseSelectedSectorTipLine(sector: MapSectorId): string {
  return t('pause.selectedSectorTip', { sector });
}
