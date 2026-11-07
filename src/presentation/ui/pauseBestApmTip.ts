/**
 * Pause overlay career peak APM tip (HUD label only).
 * Frozen matchPrefs.bestApm at pause open — distinct surface from
 * lobby Best APM ·, pause Avg APM ·, and pause APM · match-rate tips.
 */
import { t } from '../../i18n';

/** Null when prefs have no peak APM samples yet. */
export function pauseBestApmTipLine(
  bestApm: number | null | undefined,
): string | null {
  if (bestApm == null || bestApm < 0) return null;
  return t('pause.bestApmTip', { n: Math.floor(bestApm) });
}
