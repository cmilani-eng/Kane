/**
 * Lobby tip for the shortest winning match duration from match prefs.
 * Distinct from last-duration, Avg time ·, and ~min match-length tips.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Null when prefs have no recorded best (winning) duration yet. */
export function lobbyBestDurationTipLine(): string | null {
  const ms = loadMatchPrefs().bestDurationMs;
  if (ms == null || ms <= 0) return null;
  return t('lobby.bestDurationTip', { clock: formatMatchClock(ms) });
}
