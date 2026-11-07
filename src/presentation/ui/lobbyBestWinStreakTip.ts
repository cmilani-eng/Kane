/**
 * Lobby tip for peak consecutive wins from match prefs.
 * Distinct from current Streak · n and from end Best streak tip surface.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive best win streak yet. */
export function lobbyBestWinStreakTipLine(): string | null {
  const prefs = loadMatchPrefs();
  const n = Math.max(prefs.bestWinStreak ?? 0, prefs.winStreak ?? 0);
  if (n <= 0) return null;
  return t('lobby.bestWinStreakTip', { n: Math.floor(n) });
}
