import { SKIRMISH_MAP_ORDER, type SkirmishMapId } from '../../data/skirmishMaps';
import type { SpeciesId } from '../../data/speciesStub';
import type { AiDifficultyId } from './aiDifficulty';

/** Menu card order. A finished Hard tour steps to the next species. */
const SPECIES_ORDER: readonly SpeciesId[] = ['brutes', 'nobles', 'weirdos'];

export interface SpeciesStep {
  readonly species: SpeciesId;
  readonly mapId: SkirmishMapId;
}

/**
 * A Hard win on the last map offers the next species at Hard on the first map.
 * Other Hard wins still offer the next map. A loss stays put.
 */
export function nextSpeciesAfterCatalog(
  win: boolean,
  difficulty: AiDifficultyId,
  mapId: SkirmishMapId,
  species: SpeciesId,
): SpeciesStep | null {
  if (!win || difficulty !== 'hard') return null;
  const last = SKIRMISH_MAP_ORDER[SKIRMISH_MAP_ORDER.length - 1];
  const first = SKIRMISH_MAP_ORDER[0];
  if (mapId !== last || first == null) return null;
  const index = SPECIES_ORDER.indexOf(species);
  if (index < 0) return null;
  const next = SPECIES_ORDER[(index + 1) % SPECIES_ORDER.length];
  if (next == null) return null;
  return { species: next, mapId: first };
}
