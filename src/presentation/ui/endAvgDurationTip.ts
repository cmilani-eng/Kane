/**
 * End-screen career average match-duration tip (HUD label only).
 * matchPrefs.avgDurationMs after prefs write — distinct surface from
 * lobby/pause Avg time · and this-match end Time · tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Null when prefs have no positive average duration samples yet. */
export function endAvgDurationTipLine(): string | null {
  const ms = loadMatchPrefs().avgDurationMs;
  if (ms == null || ms <= 0) return null;
  return t('end.avgDurationTip', { clock: formatMatchClock(ms) });
}
