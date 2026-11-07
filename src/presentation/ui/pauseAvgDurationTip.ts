/**
 * Pause overlay career average match-duration tip (HUD label only).
 * Frozen matchPrefs.avgDurationMs at pause open — distinct surface from
 * lobby Avg time · and pause match-clock Time · tips.
 */
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Null when prefs have no positive average duration samples yet. */
export function pauseAvgDurationTipLine(
  avgDurationMs: number | null | undefined,
): string | null {
  if (avgDurationMs == null || avgDurationMs <= 0) return null;
  return t('pause.avgDurationTip', {
    clock: formatMatchClock(avgDurationMs),
  });
}
