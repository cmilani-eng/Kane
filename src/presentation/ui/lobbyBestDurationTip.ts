/**
 * Lobby tip for the shortest winning match duration from match prefs.
 * Format: Best · mm:ss — middot (U+00B7).
 * Distinct from Last · / Avg time · / Time · / Best map · /
 * ~min match-length peers (lobby-only; no end/pause Best · twin).
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
