/**
 * Rematch payload — same species, difficulty, and map as the finished skirmish.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import type { SpeciesId } from '../../data/speciesStub';
import type { AiDifficultyId } from './aiDifficulty';
import type { BattlefieldWorld } from './battlefieldWorld';

export type RematchSkirmishPrefs = {
  species: SpeciesId;
  difficulty: AiDifficultyId;
  mapId: SkirmishMapId;
};

/** Snapshot used by end-screen Rematch and matchPrefs remember. */
export function rematchPrefsFromWorld(
  world: BattlefieldWorld,
): RematchSkirmishPrefs {
  return {
    species: world.speciesId,
    difficulty: world.aiDifficulty,
    mapId: world.mapId,
  };
}
