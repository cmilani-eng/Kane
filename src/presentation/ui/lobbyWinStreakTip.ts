/**
 * Lobby tip for consecutive wins from match prefs.
 * Distinct from last-outcome Won/Lost tip.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive win streak yet. */
export function lobbyWinStreakTipLine(): string | null {
  const n = loadMatchPrefs().winStreak;
  if (n == null || n <= 0) return null;
  return t('lobby.winStreakTip', { n: Math.floor(n) });
}
