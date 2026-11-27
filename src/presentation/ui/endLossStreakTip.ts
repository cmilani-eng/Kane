/**
 * End-screen career loss-streak tip (HUD label only).
 * Format: Loss streak · {n} — middot (U+00B7).
 * Consecutive losses from match prefs after result write. Same en/pt-BR/es copy
 * as lobby/pause Loss streak · tips; distinct i18n key / surface. Distinct from
 * Streak · / Best streak · / Losses · peers.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive loss streak (e.g. after a win). */
export function endLossStreakTipLine(): string | null {
  const n = loadMatchPrefs().lossStreak;
  if (n == null || n <= 0) return null;
  return t('end.lossStreakTip', { n: Math.floor(n) });
}
