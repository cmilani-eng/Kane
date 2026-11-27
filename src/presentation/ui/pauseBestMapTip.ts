/**
 * Pause overlay career best-duration map tip (HUD label only).
 * Format: Best map · {name} — middot (U+00B7).
 * Frozen matchPrefs.bestDurationMapId at pause open — map of shortest win.
 * Distinct surface from Avg time · / Best streak · / Record · peers and from
 * lobby Best map · tip.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { mapCopy, t } from '../../i18n';

/** Null when prefs have no recorded best-duration map yet. */
export function pauseBestMapTipLine(
  mapId: SkirmishMapId | null | undefined,
): string | null {
  if (mapId == null) return null;
  return t('pause.bestMapTip', { name: mapCopy(mapId).label });
}
