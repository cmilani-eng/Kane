/**
 * Pause overlay career peak win-streak tip (HUD label only).
 * Format: Best streak · {n} — middot (U+00B7).
 * Frozen matchPrefs.bestWinStreak (max with winStreak) at pause open —
 * distinct surface from Streak · / Loss streak · / Win rate · /
 * Best APM · peers and from lobby/end Best streak · tips.
 */
import { t } from '../../i18n';

/** Null when peak streak is not positive. */
export function pauseBestWinStreakTipLine(streak: number): string | null {
  const n = Math.max(0, Math.floor(streak));
  if (n <= 0) return null;
  return t('pause.bestWinStreakTip', { n });
}
