/**
 * Pause overlay career win-streak tip (HUD label only).
 * Format: Streak · {n} — middot (U+00B7).
 * Frozen matchPrefs.winStreak at pause open — distinct surface from
 * lobby/end Streak · tips and from Loss streak · / Win rate · /
 * Best APM · / Record · peers.
 */
import { t } from '../../i18n';

/** Null when streak is not positive. */
export function pauseWinStreakTipLine(streak: number): string | null {
  const n = Math.max(0, Math.floor(streak));
  if (n <= 0) return null;
  return t('pause.winStreakTip', { n });
}
