/**
 * End-screen career wins tip (HUD label only).
 * gamesWon from match prefs — distinct surface from lobby Wins tip.
 */
import { t } from '../../i18n';
import { lobbyWinsCount } from './lobbyWinsTip';

/** Null when prefs have no finished games counted yet. */
export function endWinsTipLine(): string | null {
  const n = lobbyWinsCount();
  if (n == null) return null;
  return t('end.winsTip', { n });
}
