/**
 * Lobby tip for the last-played / remembered faction from match prefs.
 * Format: Last · {name} — distinct from Favorite ·, Played · n, and
 * selected faction motto tip (`lobby.factionTip`).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, t } from '../../i18n';

export function lobbyLastFactionTipLine(): string {
  const s = speciesCopy(loadMatchPrefs().species);
  return t('lobby.lastFactionTip', { name: s.name });
}
