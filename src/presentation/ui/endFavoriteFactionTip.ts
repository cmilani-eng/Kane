/**
 * End-screen career favorite-faction tip (HUD label only).
 * Format: Favorite · {name} — middot (U+00B7); most-played species from
 * matchPrefs.speciesPlays via favoriteFactionId.
 * Distinct from Plays · / Wins · / Streak · and from lobby/pause Favorite
 * surfaces (same en copy; distinct i18n key).
 */
import { speciesCopy, t } from '../../i18n';
import { favoriteFactionId } from './lobbyFavoriteFactionTip';

/** Null when no finished species plays are recorded yet. */
export function endFavoriteFactionTipLine(): string | null {
  const id = favoriteFactionId();
  if (id == null) return null;
  return t('end.favoriteFactionTip', { name: speciesCopy(id).name });
}
