/**
 * End-screen career peak APM tip (HUD label only).
 * matchPrefs.bestApm after prefs write — distinct surface from
 * lobby/pause Best APM ·, end Avg APM ·, and this-match end APM · tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no peak APM samples yet. */
export function endBestApmTipLine(): string | null {
  const n = loadMatchPrefs().bestApm;
  if (n == null || n < 0) return null;
  return t('end.bestApmTip', { n: Math.floor(n) });
}
