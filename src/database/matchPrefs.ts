/**
 * Last skirmish prefs — species + AI difficulty in localStorage.
 * Restored on the title menu for rematch convenience.
 */
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
  return { version: 1, species: 'nobles', difficulty: 'normal' };
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
    };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

/** Persist both fields (start match or menu change). */
export function rememberMatchPrefs(
  species: SpeciesId,
  difficulty: AiDifficultyId,
): void {
  saveMatchPrefs({ version: 1, species, difficulty });
  // Cloud sync when signed in (best-effort; guest stays local).
  void import('../firebase/cloudProgression')
    .then((m) => m.maybeSyncPrefs(species, difficulty))
    .catch(() => undefined);
}

// Note: dynamic import avoids a hard cycle (cloudProgression → matchPrefs).
