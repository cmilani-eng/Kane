/**
 * Lobby tip for the map of the shortest winning match from match prefs.
 * Distinct from last-map / selected map blurb / best-duration clock tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, t } from '../../i18n';

/** Null when prefs have no recorded best-duration map yet. */
export function lobbyBestMapTipLine(): string | null {
  const mapId = loadMatchPrefs().bestDurationMapId;
  if (mapId == null) return null;
  return t('lobby.bestMapTip', { name: mapCopy(mapId).label });
}
