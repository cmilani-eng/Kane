/**
 * Pause overlay career loss-streak tip (HUD label only).
 * Frozen matchPrefs.lossStreak at pause open — distinct surface from
 * lobby Loss streak · and pause Streak · tips.
 */
import { t } from '../../i18n';

/** Null when streak is not positive. */
export function pauseLossStreakTipLine(streak: number): string | null {
  const n = Math.max(0, Math.floor(streak));
  if (n <= 0) return null;
  return t('pause.lossStreakTip', { n });
}
