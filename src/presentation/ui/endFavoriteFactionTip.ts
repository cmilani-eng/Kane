/**
 * End-screen career favorite-faction tip (HUD label only).
 * Most-played species from match prefs speciesPlays — distinct surface
 * from lobby Favorite tip and from end species Played tip.
 */
import { speciesCopy, t } from '../../i18n';
import { favoriteFactionId } from './lobbyFavoriteFactionTip';

/** Null when no finished species plays are recorded yet. */
export function endFavoriteFactionTipLine(): string | null {
  const id = favoriteFactionId();
  if (id == null) return null;
  return t('end.favoriteFactionTip', { name: speciesCopy(id).name });
}
