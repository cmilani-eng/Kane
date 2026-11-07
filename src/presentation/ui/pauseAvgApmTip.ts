/**
 * Pause overlay career average APM tip (HUD label only).
 * Frozen matchPrefs.avgApm at pause open — distinct surface from
 * lobby Avg APM · and pause APM · match-rate tips.
 */
import { t } from '../../i18n';

/** Null when prefs have no average APM samples yet. */
export function pauseAvgApmTipLine(
  avgApm: number | null | undefined,
): string | null {
  if (avgApm == null || avgApm < 0) return null;
  return t('pause.avgApmTip', { n: Math.floor(avgApm) });
}
