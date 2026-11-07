/**
 * Pause overlay career wins tip (HUD label only).
 * Format: Wins · {n} — middot (U+00B7).
 * Frozen matchPrefs.gamesWon at pause open — distinct surface from
 * Played · / Win rate · / Record · / Streak · peers and from
 * lobby/end Wins · tips.
 */
import { t } from '../../i18n';

/** Null when prefs have no finished games counted yet. */
export function pauseWinsTipLine(won: number, played: number): string | null {
  const n = Math.max(0, Math.floor(played));
  if (n <= 0) return null;
  return t('pause.winsTip', { n: Math.max(0, Math.floor(won)) });
}
