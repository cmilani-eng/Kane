/**
 * End-screen best win-streak tip (HUD label only).
 * Peak consecutive wins from match prefs — distinct from current Streak tip
 * and lobby Best streak tip.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive best win streak yet. */
export function endBestWinStreakTipLine(): string | null {
  const prefs = loadMatchPrefs();
  const n = Math.max(prefs.bestWinStreak ?? 0, prefs.winStreak ?? 0);
  if (n <= 0) return null;
  return t('end.bestWinStreakTip', { n: Math.floor(n) });
}
