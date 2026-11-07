/**
 * End-screen career average APM tip (HUD label only).
 * matchPrefs.avgApm after prefs write — distinct surface from
 * lobby/pause Avg APM · and this-match end APM · tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no average APM samples yet. */
export function endAvgApmTipLine(): string | null {
  const n = loadMatchPrefs().avgApm;
  if (n == null || n < 0) return null;
  return t('end.avgApmTip', { n: Math.floor(n) });
}
