/**
 * Lobby tip for career peak APM from match prefs.
 * Format: Best APM · n — distinct from Avg APM · and end/pause APM · tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no peak APM samples yet. */
export function lobbyBestApmTipLine(): string | null {
  const n = loadMatchPrefs().bestApm;
  if (n == null || n < 0) return null;
  return t('lobby.bestApmTip', { n: Math.floor(n) });
}
