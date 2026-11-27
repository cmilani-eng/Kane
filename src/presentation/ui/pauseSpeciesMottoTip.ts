/**
 * Pause overlay species motto tip (HUD label only).
 * Format: {name} · {motto} — middot (U+00B7) between species name and
 * motto. Same en copy as lobby selected faction tip, distinct key/surface
 * (`pause.speciesMotto` vs `lobby.factionTip`). Distinct from Map · /
 * Objective · / Difficulty · / Favorite · / Last · / setup line.
 */
import type { SpeciesId } from '../../data/speciesStub';
import { speciesCopy, t } from '../../i18n';

export function pauseSpeciesMottoTipLine(speciesId: SpeciesId): string {
  const s = speciesCopy(speciesId);
  return t('pause.speciesMotto', { name: s.name, motto: s.motto });
}
