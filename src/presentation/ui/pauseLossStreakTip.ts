/**
 * Pause overlay career loss-streak tip (HUD label only).
 * Format: Loss streak · {n} — middot (U+00B7).
 * Frozen matchPrefs.lossStreak at pause open. Same en/pt-BR/es copy as
 * lobby/end Loss streak · tips; distinct i18n key / surface. Distinct from
 * Streak · / Best streak · / Losses · peers.
 */
import { t } from '../../i18n';

/** Null when streak is not positive. */
export function pauseLossStreakTipLine(streak: number): string | null {
  const n = Math.max(0, Math.floor(streak));
  if (n <= 0) return null;
  return t('pause.lossStreakTip', { n });
}
