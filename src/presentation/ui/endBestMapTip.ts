/**
 * End-screen career best-duration map tip (HUD label only).
 * Format: Best map · {name} — middot (U+00B7).
 * Prefs: matchPrefs.bestDurationMapId (map of shortest win) after prefs write.
 * Distinct surface from Avg time · / Best streak · / Record · peers and from
 * lobby/pause Best map · tips (same en copy; distinct i18n key / surface).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, t } from '../../i18n';

/** Null when prefs have no recorded best-duration map yet. */
export function endBestMapTipLine(): string | null {
  const mapId = loadMatchPrefs().bestDurationMapId;
  if (mapId == null) return null;
  return t('end.bestMapTip', { name: mapCopy(mapId).label });
}
