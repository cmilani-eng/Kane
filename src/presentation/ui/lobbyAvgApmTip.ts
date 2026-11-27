/**
 * Lobby tip for career average APM from match prefs.
 * Format: Avg APM · {n} — middot (U+00B7).
 * Distinct from Best APM · / APM · (match-rate) / Avg time · peers;
 * same en/pt-BR/es copy as end/pause Avg APM · (distinct i18n key / surface).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no average APM samples yet. */
export function lobbyAvgApmTipLine(): string | null {
  const n = loadMatchPrefs().avgApm;
  if (n == null || n < 0) return null;
  return t('lobby.avgApmTip', { n: Math.floor(n) });
}
