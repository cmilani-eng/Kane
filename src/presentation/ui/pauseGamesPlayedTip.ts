/**
 * Pause overlay career games-played tip (HUD label only).
 * Frozen matchPrefs.gamesPlayed at pause open — distinct surface from
 * lobby/end Played · tips.
 */
import { t } from '../../i18n';

/** Null when prefs have no finished games counted yet. */
export function pauseGamesPlayedTipLine(played: number): string | null {
  const n = Math.max(0, Math.floor(played));
  if (n <= 0) return null;
  return t('pause.gamesPlayedTip', { n });
}
