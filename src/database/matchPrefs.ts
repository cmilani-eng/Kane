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
  /** Last finished match duration (ms). Optional for older prefs. */
  lastDurationMs?: number;
  /** Last finished match outcome. Optional for older prefs. */
  lastWon?: boolean;
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

function normalizeDurationMs(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return undefined;
  return Math.floor(v);
}

function normalizeWon(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
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
    const lastDurationMs = normalizeDurationMs(parsed.lastDurationMs);
    const lastWon = normalizeWon(parsed.lastWon);
    return {
      version: 1,
      species: isSpeciesId(parsed.species) ? parsed.species : base.species,
      difficulty: getAiDifficulty(parsed.difficulty).id,
      mapId: isSkirmishMapId(parsed.mapId) ? parsed.mapId : base.mapId,
      ...(lastDurationMs != null ? { lastDurationMs } : {}),
      ...(lastWon != null ? { lastWon } : {}),
    };
  } catch {
    return base;
  }
}

export function saveMatchPrefs(prefs: MatchPrefs): void {
  if (!canStore()) return;
  try {
    const lastDurationMs = normalizeDurationMs(prefs.lastDurationMs);
    const lastWon = normalizeWon(prefs.lastWon);
    const next: MatchPrefs = {
      version: 1,
      species: isSpeciesId(prefs.species) ? prefs.species : 'nobles',
      difficulty: getAiDifficulty(prefs.difficulty).id,
      mapId: isSkirmishMapId(prefs.mapId) ? prefs.mapId : DEFAULT_SKIRMISH_MAP,
      ...(lastDurationMs != null ? { lastDurationMs } : {}),
      ...(lastWon != null ? { lastWon } : {}),
    };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Persist prefs (start match or menu change).
 * Optional duration / outcome keep prior values when omitted.
 */
export function rememberMatchPrefs(
  species: SpeciesId,
  difficulty: AiDifficultyId,
  mapId: SkirmishMapId = DEFAULT_SKIRMISH_MAP,
  lastDurationMs?: number,
  lastWon?: boolean,
): void {
  const prev = loadMatchPrefs();
  const duration =
    lastDurationMs != null && lastDurationMs > 0
      ? Math.floor(lastDurationMs)
      : prev.lastDurationMs;
  const won = lastWon != null ? lastWon : prev.lastWon;
  saveMatchPrefs({
    version: 1,
    species,
    difficulty,
    mapId,
    ...(duration != null ? { lastDurationMs: duration } : {}),
    ...(won != null ? { lastWon: won } : {}),
  });
  // Cloud sync when signed in (best-effort; guest stays local).
  // Cloud profile still stores species + difficulty only.
  void import('../firebase/cloudProgression')
    .then((m) => m.maybeSyncPrefs(species, difficulty))
    .catch(() => undefined);
}

// Note: dynamic import avoids a hard cycle (cloudProgression → matchPrefs).
