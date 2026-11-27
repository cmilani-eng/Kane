/**
 * Lobby tip for career losses from match prefs (played − won).
 * Losses · n (U+00B7); en/pt-BR/es middot; same copy as end Losses ·,
 * distinct key/surface (no pause Losses tip); distinct from Played · /
 * Record · / Wins · / Win rate · / Loss streak ·.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Non-negative losses count. Null when no finished matches yet. */
export function lobbyLossesCount(): number | null {
  const prefs = loadMatchPrefs();
  const played = prefs.gamesPlayed;
  if (played == null || played <= 0) return null;
  const won = Math.max(0, Math.floor(prefs.gamesWon ?? 0));
  const n = Math.max(0, Math.floor(played));
  return Math.max(0, n - won);
}

/** Null when prefs have no finished games counted yet. */
export function lobbyLossesTipLine(): string | null {
  const n = lobbyLossesCount();
  if (n == null) return null;
  return t('lobby.lossesTip', { n });
}
