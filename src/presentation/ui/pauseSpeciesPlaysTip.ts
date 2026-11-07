/**
 * Pause overlay career species-plays tip (HUD label only).
 * Format: Plays · {n} — middot (U+00B7).
 * Frozen favorite-species play count from matchPrefs.speciesPlays at
 * pause open — distinct surface from Played · / Wins · / Streak · peers
 * and from lobby Plays · tip.
 */
import { t } from '../../i18n';

/** Null when prefs have no finished species plays counted yet. */
export function pauseSpeciesPlaysTipLine(plays: number): string | null {
  const n = Math.max(0, Math.floor(plays));
  if (n <= 0) return null;
  return t('pause.speciesPlaysTip', { n });
}
