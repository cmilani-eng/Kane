/**
 * Lobby tip for the last-played / remembered map from match prefs.
 * Format: Last map · {name} — middot (U+00B7).
 * Distinct from Best map · / Map · w×h / selected map blurb tip (`lobby.mapTip`).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, t } from '../../i18n';

export function lobbyLastMapTipLine(): string {
  const map = mapCopy(loadMatchPrefs().mapId);
  return t('lobby.lastMapTip', { name: map.label });
}
