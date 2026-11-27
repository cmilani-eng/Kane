/**
 * Pause overlay career favorite-faction tip (HUD label only).
 * Format: Favorite · {name} — middot (U+00B7); most-played species from
 * matchPrefs.speciesPlays frozen at pause open.
 * Distinct from Plays · / Wins · / Streak · and from lobby/end Favorite surfaces.
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
