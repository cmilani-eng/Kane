/**
 * Lobby last-result tip for the last finished match outcome from match prefs.
 * Format: Last · Won / Last · Lost — distinct from Last duration / Last faction / Streak.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no recorded outcome yet. */
export function lobbyLastOutcomeTipLine(): string | null {
  const won = loadMatchPrefs().lastWon;
  if (won == null) return null;
  return t(won ? 'lobby.lastOutcomeWin' : 'lobby.lastOutcomeLoss');
}
