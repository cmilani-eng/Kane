/**
 * Pause overlay career favorite-faction tip (HUD label only).
 * Frozen most-played species at pause open — distinct surface from
 * lobby/end Favorite · tips.
 */
import type { SpeciesId } from '../../data/speciesStub';
import { speciesCopy, t } from '../../i18n';

/** Null when no finished species plays are recorded yet. */
export function pauseFavoriteFactionTipLine(
  speciesId: SpeciesId | null | undefined,
): string | null {
  if (speciesId == null) return null;
  return t('pause.favoriteFactionTip', {
    name: speciesCopy(speciesId).name,
  });
}
