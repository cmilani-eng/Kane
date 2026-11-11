/**
 * End-screen career losses tip (HUD label only).
 * gamesPlayed − gamesWon from match prefs — Losses · n (U+00B7); same en/pt-BR/es
 * copy as lobby Losses ·, distinct key/surface; distinct from Played · / Record · /
 * Wins · / Win rate · / Loss streak · / Lost · (units this match).
 */
import { t } from '../../i18n';
import { lobbyLossesCount } from './lobbyLossesTip';

/** Null when prefs have no finished games counted yet. */
export function endLossesTipLine(): string | null {
  const n = lobbyLossesCount();
  if (n == null) return null;
  return t('end.lossesTip', { n });
}
