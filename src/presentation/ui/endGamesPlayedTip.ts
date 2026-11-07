/**
 * End-screen career games-played tip (HUD label only).
 * Finished-match count from match prefs — distinct surface from lobby Played tip
 * and from end.speciesTip (Played · faction).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no finished games counted yet. */
export function endGamesPlayedTipLine(): string | null {
  const n = loadMatchPrefs().gamesPlayed;
  if (n == null || n <= 0) return null;
  return t('end.gamesPlayedTip', { n: Math.floor(n) });
}
