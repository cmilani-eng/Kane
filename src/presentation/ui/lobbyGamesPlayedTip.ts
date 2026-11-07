/**
 * Lobby tip for finished-match count from match prefs.
 * Format: Played · {n} — middot (U+00B7).
 * Distinct from Record · / Streak · / Win rate · / Plays · peers and from
 * end/pause Played · tip surfaces / stats panel.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no finished games counted yet. */
export function lobbyGamesPlayedTipLine(): string | null {
  const n = loadMatchPrefs().gamesPlayed;
  if (n == null || n <= 0) return null;
  return t('lobby.gamesPlayedTip', { n: Math.floor(n) });
}
