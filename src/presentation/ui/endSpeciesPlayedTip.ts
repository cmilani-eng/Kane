/**
 * End-screen species played tip (HUD label only).
 */
import type { SpeciesId } from '../../data/speciesStub';
import { speciesName, t } from '../../i18n';

export function endSpeciesPlayedTipLine(speciesId: SpeciesId): string {
  return t('end.speciesTip', { name: speciesName(speciesId) });
}
