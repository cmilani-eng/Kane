/**
 * Lobby tip for win rate from match prefs (wins / finished games).
 * Format: Win rate · {n}% — middot (U+00B7).
 * Distinct from Played · / Record · / Streak · / Wins · peers and from
 * end/pause Win rate · tip surfaces (same copy, distinct i18n key).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Whole percent 0–100. Null when no finished matches yet. */
export function lobbyWinRatePercent(): number | null {
  const prefs = loadMatchPrefs();
  const played = prefs.gamesPlayed;
  if (played == null || played <= 0) return null;
  const won = Math.max(0, Math.floor(prefs.gamesWon ?? 0));
  const n = Math.max(0, Math.floor(played));
  return Math.min(100, Math.round((100 * won) / n));
}

/** Null when prefs have no finished games counted yet. */
export function lobbyWinRateTipLine(): string | null {
  const pct = lobbyWinRatePercent();
  if (pct == null) return null;
  return t('lobby.winRateTip', { n: pct });
}
