/**
 * Pause overlay species motto tip (HUD label only).
 */
import type { SpeciesId } from '../../data/speciesStub';
import { speciesCopy, t } from '../../i18n';

export function pauseSpeciesMottoTipLine(speciesId: SpeciesId): string {
  const s = speciesCopy(speciesId);
  return t('pause.speciesMotto', { name: s.name, motto: s.motto });
}
