/**
 * Lobby tip for the last-played / remembered faction from match prefs.
 * Format: Last · {name} — middot (U+00B7).
 * Distinct from Favorite · / Played · / Last · duration / Last · Won-Lost /
 * selected faction motto tip (`lobby.factionTip`).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, t } from '../../i18n';

export function lobbyLastFactionTipLine(): string {
  const s = speciesCopy(loadMatchPrefs().species);
  return t('lobby.lastFactionTip', { name: s.name });
}
