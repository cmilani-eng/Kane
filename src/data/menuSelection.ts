/**
 * What the main menu hands to a match: species, AI difficulty and map.
 * Plain data with no Phaser or DOM imports, so the menu overlay and the match both use it.
 */
import type { AiDifficultyId } from '../gameplay/battlefield/aiDifficulty';
import { AI_DIFFICULTY_ORDER } from '../gameplay/battlefield/aiDifficulty';
import { DEFAULT_SKIRMISH_MAP, SKIRMISH_MAP_ORDER, type SkirmishMapId } from './skirmishMaps';
import { PROTOTYPE_SPECIES_ID, SPECIES, type SpeciesId } from './speciesStub';

export interface MenuSelection {
  species: SpeciesId;
  difficulty: AiDifficultyId;
  mapId: SkirmishMapId;
}

/** The menu's starting choice, as the Phaser menu has it today. */
export const MENU_DEFAULT_SELECTION: MenuSelection = {
  species: PROTOTYPE_SPECIES_ID,
  difficulty: 'normal',
  mapId: DEFAULT_SKIRMISH_MAP,
};

/** The data the Battlefield scene receives on start. Keep this shape stable. */
export interface BattlefieldStartData {
  species: SpeciesId;
  difficulty: AiDifficultyId;
  mapId: SkirmishMapId;
}

export function toBattlefieldStartData(selection: MenuSelection): BattlefieldStartData {
  return {
    species: selection.species,
    difficulty: selection.difficulty,
    mapId: selection.mapId,
  };
}

/** True when a value is a known species, difficulty and map, e.g. from storage or a URL. */
export function isMenuSelection(value: unknown): value is MenuSelection {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.species === 'string' &&
    v.species in SPECIES &&
    AI_DIFFICULTY_ORDER.includes(v.difficulty as AiDifficultyId) &&
    SKIRMISH_MAP_ORDER.includes(v.mapId as SkirmishMapId)
  );
}
