/**
 * End-screen win-streak tip (HUD label only).
 * Career consecutive wins from match prefs — distinct from lobby Streak tip.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive win streak (e.g. after a loss). */
export function endWinStreakTipLine(): string | null {
  const n = loadMatchPrefs().winStreak;
  if (n == null || n <= 0) return null;
  return t('end.winStreakTip', { n: Math.floor(n) });
}
