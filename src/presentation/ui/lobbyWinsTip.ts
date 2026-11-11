/**
 * Lobby tip for career wins from match prefs.
 * Format: Wins · {n} — middot (U+00B7) with single spaces; en/pt-BR/es middot.
 * Distinct from Played · / Record · / Streak · / Win rate · peers
 * and from pause/end Wins · tips (same en copy; distinct i18n key / surface).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Non-negative wins count. Null when no finished matches yet. */
export function lobbyWinsCount(): number | null {
  const prefs = loadMatchPrefs();
  const played = prefs.gamesPlayed;
  if (played == null || played <= 0) return null;
  return Math.max(0, Math.floor(prefs.gamesWon ?? 0));
}

/** Null when prefs have no finished games counted yet. */
export function lobbyWinsTipLine(): string | null {
  const n = lobbyWinsCount();
  if (n == null) return null;
  return t('lobby.winsTip', { n });
}
