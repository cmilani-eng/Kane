/**
 * Lobby tip for career average match duration from match prefs.
 * Format: Avg time · mm:ss — distinct from Last · / Best · and ~min match-length.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Null when prefs have no positive average duration samples yet. */
export function lobbyAvgDurationTipLine(): string | null {
  const ms = loadMatchPrefs().avgDurationMs;
  if (ms == null || ms <= 0) return null;
  return t('lobby.avgDurationTip', { clock: formatMatchClock(ms) });
}
