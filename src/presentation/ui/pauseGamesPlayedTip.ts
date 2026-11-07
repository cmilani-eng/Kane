/**
 * Pause overlay career games-played tip (HUD label only).
 * Format: Played · {n} — middot (U+00B7).
 * Frozen matchPrefs.gamesPlayed at pause open — distinct surface from
 * Win rate · / Record · / Streak · / Best streak · peers and from
 * lobby/end Played · tips.
 */
import { t } from '../../i18n';

/** Null when prefs have no finished games counted yet. */
export function pauseGamesPlayedTipLine(played: number): string | null {
  const n = Math.max(0, Math.floor(played));
  if (n <= 0) return null;
  return t('pause.gamesPlayedTip', { n });
}
