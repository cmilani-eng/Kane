/**
 * End-screen career peak APM tip (HUD label only).
 * Format: Best APM · {n} — middot (U+00B7).
 * Distinct from Avg APM · / APM · (match-rate) / Avg time · peers;
 * same en/pt-BR/es copy as lobby/pause Best APM · (distinct i18n key / surface).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no peak APM samples yet. */
export function endBestApmTipLine(): string | null {
  const n = loadMatchPrefs().bestApm;
  if (n == null || n < 0) return null;
  return t('end.bestApmTip', { n: Math.floor(n) });
}
