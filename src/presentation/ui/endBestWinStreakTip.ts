/**
 * End-screen best win-streak tip (HUD label only).
 * Format: Best streak · {n} — middot (U+00B7).
 * Peak consecutive wins from match prefs (max of bestWinStreak / winStreak) —
 * distinct from Streak · / Loss streak · / Best APM · peers and from
 * lobby/pause Best streak · tips (same en copy; distinct i18n key / surface).
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
