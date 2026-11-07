/**
 * Lobby tip for current consecutive losses from match prefs.
 * Distinct from Streak · / Best streak · / Losses · tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive loss streak yet. */
export function lobbyLossStreakTipLine(): string | null {
  const n = loadMatchPrefs().lossStreak;
  if (n == null || n <= 0) return null;
  return t('lobby.lossStreakTip', { n: Math.floor(n) });
}
