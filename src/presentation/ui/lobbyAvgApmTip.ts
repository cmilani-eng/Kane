/**
 * Lobby tip for career average APM from match prefs.
 * Format: Avg APM · n — distinct from end/pause APM · match-rate tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no average APM samples yet. */
export function lobbyAvgApmTipLine(): string | null {
  const n = loadMatchPrefs().avgApm;
  if (n == null || n < 0) return null;
  return t('lobby.avgApmTip', { n: Math.floor(n) });
}
