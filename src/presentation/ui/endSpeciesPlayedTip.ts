/**
 * End-screen species played tip (HUD label only).
 * Format: Played · {name} — middot (U+00B7) from match speciesId.
 * Distinct from Played · n / Plays · / Favorite · / Last · / selection Species ·.
 */
import type { SpeciesId } from '../../data/speciesStub';
import { speciesName, t } from '../../i18n';

/** Played · {name} — faction played this match (middot U+00B7). */
export function endSpeciesPlayedTipLine(speciesId: SpeciesId): string {
  return t('end.speciesTip', { name: speciesName(speciesId) });
}
