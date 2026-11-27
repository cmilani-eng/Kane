/**
 * End-screen career games-played tip (HUD label only).
 * Format: Played · {n} — middot (U+00B7).
 * Finished-match count from match prefs — distinct from Record · / Streak · /
 * Win rate · / Best streak · peers and from end.speciesTip (Played · faction);
 * same en copy as lobby/pause Played · (distinct i18n key / surface).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no finished games counted yet. */
export function endGamesPlayedTipLine(): string | null {
  const n = loadMatchPrefs().gamesPlayed;
  if (n == null || n <= 0) return null;
  return t('end.gamesPlayedTip', { n: Math.floor(n) });
}
