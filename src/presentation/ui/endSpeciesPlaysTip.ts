/**
 * End-screen career species-plays tip (HUD label only).
 * Format: Plays · {n} — middot (U+00B7).
 * Favorite-species play count from matchPrefs.speciesPlays via
 * lobbySpeciesPlaysCount — distinct from Played · / Wins · / Streak · peers
 * and from lobby/pause Plays · tips (same en copy; distinct i18n key / surface).
 */
import { t } from '../../i18n';
import { lobbySpeciesPlaysCount } from './lobbySpeciesPlaysTip';

/** Null when prefs have no finished species plays counted yet. */
export function endSpeciesPlaysTipLine(): string | null {
  const n = lobbySpeciesPlaysCount();
  if (n == null) return null;
  return t('end.speciesPlaysTip', { n });
}
