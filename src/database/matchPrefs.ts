/**
 * Last skirmish prefs — species + AI difficulty + map in localStorage.
 * Restored on the title menu for rematch convenience.
 */
import {
  DEFAULT_SKIRMISH_MAP,
  isSkirmishMapId,
  type SkirmishMapId,
} from '../data/skirmishMaps';
import type { SpeciesId } from '../data/speciesStub';
import {
  getAiDifficulty,
  type AiDifficultyId,
} from '../gameplay/battlefield/aiDifficulty';

const KEY = 'kane.matchPrefs.v1';

const SPECIES_IDS: SpeciesId[] = ['brutes', 'nobles', 'weirdos'];

export interface MatchPrefs {
  version: 1;
  species: SpeciesId;
  difficulty: AiDifficultyId;
  mapId: SkirmishMapId;
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function isSpeciesId(v: unknown): v is SpeciesId {
  return typeof v === 'string' && (SPECIES_IDS as string[]).includes(v);
}

export function defaultMatchPrefs(): MatchPrefs {
  return {
    version: 1,
    species: 'nobles',
    difficulty: 'normal',
    mapId: DEFAULT_SKIRMISH_MAP,
  };
}

export function loadMatchPrefs(): MatchPrefs {
  const base = defaultMatchPrefs();
  if (!canStore()) return base;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<MatchPrefs>;
    return {
      version: 1,
      species: isSpeciesId(parsed.species) ? parsed.species : base.species,
      difficulty: getAiDifficulty(parsed.difficulty).id,
      mapId: isSkirmishMapId(parsed.mapId) ? parsed.mapId : base.mapId,
    };
  } catch {
    return base;
  }
}

export function saveMatchPrefs(prefs: MatchPrefs): void {
  if (!canStore()) return;
  try {
    const next: MatchPrefs = {
      version: 1,
      species: isSpeciesId(prefs.species) ? prefs.species : 'nobles',
      difficulty: getAiDifficulty(prefs.difficulty).id,
      mapId: isSkirmishMapId(prefs.mapId) ? prefs.mapId : DEFAULT_SKIRMISH_MAP,
    };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

/** Persist prefs (start match or menu change). */
export function rememberMatchPrefs(
  species: SpeciesId,
  difficulty: AiDifficultyId,
  mapId: SkirmishMapId = DEFAULT_SKIRMISH_MAP,
): void {
  saveMatchPrefs({ version: 1, species, difficulty, mapId });
  // Cloud sync when signed in (best-effort; guest stays local).
  // Cloud profile still stores species + difficulty only.
  void import('../firebase/cloudProgression')
    .then((m) => m.maybeSyncPrefs(species, difficulty))
    .catch(() => undefined);
}

// Note: dynamic import avoids a hard cycle (cloudProgression → matchPrefs).
