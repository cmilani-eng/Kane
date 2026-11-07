/**
 * End-screen career loss-streak tip (HUD label only).
 * Consecutive losses from match prefs after result write — distinct surface from
 * lobby/pause Loss streak · and end Streak · (win) tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive loss streak (e.g. after a win). */
export function endLossStreakTipLine(): string | null {
  const n = loadMatchPrefs().lossStreak;
  if (n == null || n <= 0) return null;
  return t('end.lossStreakTip', { n: Math.floor(n) });
}
