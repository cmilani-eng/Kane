/**
 * Lobby tip for the last finished match duration from match prefs.
 * Format: Last · mm:ss — middot (U+00B7).
 * Distinct from Best · / Avg time · / Time · / Last · Won-Lost /
 * Last · faction / ~min match-length peers.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Null when prefs have no positive last duration yet. */
export function lobbyLastDurationTipLine(): string | null {
  const ms = loadMatchPrefs().lastDurationMs;
  if (ms == null || ms <= 0) return null;
  return t('lobby.lastDurationTip', { clock: formatMatchClock(ms) });
}
