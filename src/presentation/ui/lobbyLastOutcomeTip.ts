/**
 * Lobby tip for the last finished match outcome from match prefs.
 * Distinct from duration / faction / map last tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no recorded outcome yet. */
export function lobbyLastOutcomeTipLine(): string | null {
  const won = loadMatchPrefs().lastWon;
  if (won == null) return null;
  return t(won ? 'lobby.lastOutcomeWin' : 'lobby.lastOutcomeLoss');
}
