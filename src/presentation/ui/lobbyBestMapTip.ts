/**
 * Lobby tip for the map of the shortest winning match from match prefs.
 * Format: Best map · {name} — middot (U+00B7).
 * Prefs: matchPrefs.bestDurationMapId (map of shortest win).
 * Distinct surface from Avg time · / Best streak · / Record · peers and from
 * Last map · / Best · clock / pause Best map · (same en copy; distinct key).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, t } from '../../i18n';

/** Null when prefs have no recorded best-duration map yet. */
export function lobbyBestMapTipLine(): string | null {
  const mapId = loadMatchPrefs().bestDurationMapId;
  if (mapId == null) return null;
  return t('lobby.bestMapTip', { name: mapCopy(mapId).label });
}
