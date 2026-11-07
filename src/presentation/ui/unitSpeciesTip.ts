/**
 * Selection species-name tip (HUD label only).
 * Format: Species · {name} — middot (U+00B7).
 * Distinct from Role · / Name · / Armor · class;
 * selection-only tip (no lobby/pause twin).
 */
import type { SpeciesId } from '../../data/speciesStub';
import { speciesName, t } from '../../i18n';

export function unitSpeciesTipLabel(speciesId: SpeciesId): string {
  return t('sel.speciesTip', { name: speciesName(speciesId) });
}

/** Shared species tip when every selected unit shares one species. */
export function sharedUnitSpeciesTipLabel(
  speciesIds: readonly SpeciesId[],
): string | null {
  if (speciesIds.length === 0) return null;
  const first = speciesIds[0]!;
  for (let i = 1; i < speciesIds.length; i++) {
    if (speciesIds[i] !== first) return null;
  }
  return unitSpeciesTipLabel(first);
}
