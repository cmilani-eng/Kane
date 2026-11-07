/**
 * Lobby tip for finished matches with the favorite (most-played) species.
 * Format: Plays · {n} — distinct from Played · n / Favorite · name / Last · name.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { favoriteFactionId } from './lobbyFavoriteFactionTip';

/** Favorite species play count. Null when no speciesPlays yet. */
export function lobbySpeciesPlaysCount(): number | null {
  const id = favoriteFactionId();
  if (id == null) return null;
  const n = Math.max(0, Math.floor(loadMatchPrefs().speciesPlays?.[id] ?? 0));
  return n > 0 ? n : null;
}

/** Null when prefs have no finished species plays yet. */
export function lobbySpeciesPlaysTipLine(): string | null {
  const n = lobbySpeciesPlaysCount();
  if (n == null) return null;
  return t('lobby.speciesPlaysTip', { n });
}
