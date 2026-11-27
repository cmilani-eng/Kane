/**
 * End-screen career wins tip (HUD label only).
 * Format: Wins · {n} — middot (U+00B7).
 * gamesWon from match prefs via lobbyWinsCount — distinct from
 * Played · / Record · / Streak · / Win rate · peers and from
 * lobby/pause Wins · tips (same en copy; distinct i18n key / surface).
 */
import { t } from '../../i18n';
import { lobbyWinsCount } from './lobbyWinsTip';

/** Null when prefs have no finished games counted yet. */
export function endWinsTipLine(): string | null {
  const n = lobbyWinsCount();
  if (n == null) return null;
  return t('end.winsTip', { n });
}
