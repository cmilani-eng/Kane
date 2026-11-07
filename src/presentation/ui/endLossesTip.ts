/**
 * End-screen career losses tip (HUD label only).
 * gamesPlayed − gamesWon from match prefs — distinct surface from lobby Losses
 * tip and from end Lost · n (units lost this match).
 */
import { t } from '../../i18n';
import { lobbyLossesCount } from './lobbyLossesTip';

/** Null when prefs have no finished games counted yet. */
export function endLossesTipLine(): string | null {
  const n = lobbyLossesCount();
  if (n == null) return null;
  return t('end.lossesTip', { n });
}
