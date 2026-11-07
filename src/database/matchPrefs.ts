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
  /** Consecutive wins ending at the last finished match. Optional for older prefs. */
  winStreak?: number;
  /** Consecutive losses ending at the last finished match. Optional for older prefs. */
  lossStreak?: number;
  /** Longest consecutive win streak on this device. Optional for older prefs. */
  bestWinStreak?: number;
  /** Shortest winning match duration (ms). Optional for older prefs. */
  bestDurationMs?: number;
  /** Map of the shortest winning match. Optional for older prefs. */
  bestDurationMapId?: SkirmishMapId;
  /** Career average finished-match duration (ms). Optional for older prefs. */
  avgDurationMs?: number;
  /** Finished matches counted into avgDurationMs. Optional for older prefs. */
  avgDurationSamples?: number;
  /** Finished matches counted on this device. Optional for older prefs. */
  gamesPlayed?: number;
  /** Finished wins counted on this device. Optional for older prefs. */
  gamesWon?: number;
  /** Finished matches per species on this device. Optional for older prefs. */
  speciesPlays?: Partial<Record<SpeciesId, number>>;
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

function normalizeWinStreak(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return undefined;
  return Math.floor(v);
}

function normalizeGamesPlayed(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return undefined;
  return Math.floor(v);
}

function normalizeAvgDurationSamples(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return undefined;
  return Math.floor(v);
}

function normalizeGamesWon(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return undefined;
  return Math.floor(v);
}

function normalizeSpeciesPlays(
  v: unknown,
): Partial<Record<SpeciesId, number>> | undefined {
  if (v == null || typeof v !== 'object') return undefined;
  const raw = v as Record<string, unknown>;
  const out: Partial<Record<SpeciesId, number>> = {};
  let any = false;
  for (const id of SPECIES_IDS) {
    const n = normalizeGamesPlayed(raw[id]);
    if (n != null) {
      out[id] = n;
      any = true;
    }
  }
  return any ? out : undefined;
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
    const winStreak = normalizeWinStreak(parsed.winStreak);
    const lossStreak = normalizeWinStreak(parsed.lossStreak);
    const bestWinStreak = normalizeWinStreak(parsed.bestWinStreak);
    const bestDurationMs = normalizeDurationMs(parsed.bestDurationMs);
    const bestDurationMapId = isSkirmishMapId(parsed.bestDurationMapId)
      ? parsed.bestDurationMapId
      : undefined;
    const avgDurationMs = normalizeDurationMs(parsed.avgDurationMs);
    const avgDurationSamples = normalizeAvgDurationSamples(
      parsed.avgDurationSamples,
    );
    const gamesPlayed = normalizeGamesPlayed(parsed.gamesPlayed);
    const gamesWon = normalizeGamesWon(parsed.gamesWon);
    const speciesPlays = normalizeSpeciesPlays(parsed.speciesPlays);
    return {
      version: 1,
      species: isSpeciesId(parsed.species) ? parsed.species : base.species,
      difficulty: getAiDifficulty(parsed.difficulty).id,
      mapId: isSkirmishMapId(parsed.mapId) ? parsed.mapId : base.mapId,
      ...(lastDurationMs != null ? { lastDurationMs } : {}),
      ...(lastWon != null ? { lastWon } : {}),
      ...(winStreak != null ? { winStreak } : {}),
      ...(lossStreak != null ? { lossStreak } : {}),
      ...(bestWinStreak != null ? { bestWinStreak } : {}),
      ...(bestDurationMs != null ? { bestDurationMs } : {}),
      ...(bestDurationMapId != null ? { bestDurationMapId } : {}),
      ...(avgDurationMs != null ? { avgDurationMs } : {}),
      ...(avgDurationSamples != null ? { avgDurationSamples } : {}),
      ...(gamesPlayed != null ? { gamesPlayed } : {}),
      ...(gamesWon != null ? { gamesWon } : {}),
      ...(speciesPlays != null ? { speciesPlays } : {}),
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
    const winStreak = normalizeWinStreak(prefs.winStreak);
    const lossStreak = normalizeWinStreak(prefs.lossStreak);
    const bestWinStreak = normalizeWinStreak(prefs.bestWinStreak);
    const bestDurationMs = normalizeDurationMs(prefs.bestDurationMs);
    const bestDurationMapId = isSkirmishMapId(prefs.bestDurationMapId)
      ? prefs.bestDurationMapId
      : undefined;
    const avgDurationMs = normalizeDurationMs(prefs.avgDurationMs);
    const avgDurationSamples = normalizeAvgDurationSamples(
      prefs.avgDurationSamples,
    );
    const gamesPlayed = normalizeGamesPlayed(prefs.gamesPlayed);
    const gamesWon = normalizeGamesWon(prefs.gamesWon);
    const speciesPlays = normalizeSpeciesPlays(prefs.speciesPlays);
    const next: MatchPrefs = {
      version: 1,
      species: isSpeciesId(prefs.species) ? prefs.species : 'nobles',
      difficulty: getAiDifficulty(prefs.difficulty).id,
      mapId: isSkirmishMapId(prefs.mapId) ? prefs.mapId : DEFAULT_SKIRMISH_MAP,
      ...(lastDurationMs != null ? { lastDurationMs } : {}),
      ...(lastWon != null ? { lastWon } : {}),
      ...(winStreak != null ? { winStreak } : {}),
      ...(lossStreak != null ? { lossStreak } : {}),
      ...(bestWinStreak != null ? { bestWinStreak } : {}),
      ...(bestDurationMs != null ? { bestDurationMs } : {}),
      ...(bestDurationMapId != null ? { bestDurationMapId } : {}),
      ...(avgDurationMs != null ? { avgDurationMs } : {}),
      ...(avgDurationSamples != null ? { avgDurationSamples } : {}),
      ...(gamesPlayed != null ? { gamesPlayed } : {}),
      ...(gamesWon != null ? { gamesWon } : {}),
      ...(speciesPlays != null ? { speciesPlays } : {}),
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
  let winStreak = prev.winStreak;
  let lossStreak = prev.lossStreak;
  let bestWinStreak = prev.bestWinStreak;
  if (lastWon != null) {
    winStreak = lastWon ? (prev.winStreak ?? 0) + 1 : 0;
    lossStreak = lastWon ? 0 : (prev.lossStreak ?? 0) + 1;
    if (winStreak > 0) {
      bestWinStreak = Math.max(prev.bestWinStreak ?? 0, winStreak);
    }
  }
  let bestDurationMs = prev.bestDurationMs;
  let bestDurationMapId = prev.bestDurationMapId;
  if (
    lastWon === true &&
    lastDurationMs != null &&
    lastDurationMs > 0
  ) {
    const nextBest = Math.floor(lastDurationMs);
    if (prev.bestDurationMs == null || nextBest < prev.bestDurationMs) {
      bestDurationMs = nextBest;
      bestDurationMapId = mapId;
    }
  }
  let avgDurationMs = prev.avgDurationMs;
  let avgDurationSamples = prev.avgDurationSamples;
  if (lastWon != null && lastDurationMs != null && lastDurationMs > 0) {
    const sample = Math.floor(lastDurationMs);
    const n = (prev.avgDurationSamples ?? 0) + 1;
    const prevAvg = prev.avgDurationMs ?? 0;
    avgDurationMs = Math.floor((prevAvg * (n - 1) + sample) / n);
    avgDurationSamples = n;
  }
  let gamesPlayed = prev.gamesPlayed;
  let gamesWon = prev.gamesWon;
  let speciesPlays = prev.speciesPlays;
  if (lastWon != null) {
    gamesPlayed = (prev.gamesPlayed ?? 0) + 1;
    if (lastWon) gamesWon = (prev.gamesWon ?? 0) + 1;
    speciesPlays = { ...(prev.speciesPlays ?? {}) };
    speciesPlays[species] = (speciesPlays[species] ?? 0) + 1;
  }
  saveMatchPrefs({
    version: 1,
    species,
    difficulty,
    mapId,
    ...(duration != null ? { lastDurationMs: duration } : {}),
    ...(won != null ? { lastWon: won } : {}),
    ...(winStreak != null ? { winStreak } : {}),
    ...(lossStreak != null ? { lossStreak } : {}),
    ...(bestWinStreak != null ? { bestWinStreak } : {}),
    ...(bestDurationMs != null ? { bestDurationMs } : {}),
    ...(bestDurationMapId != null ? { bestDurationMapId } : {}),
    ...(avgDurationMs != null ? { avgDurationMs } : {}),
    ...(avgDurationSamples != null ? { avgDurationSamples } : {}),
    ...(gamesPlayed != null ? { gamesPlayed } : {}),
    ...(gamesWon != null ? { gamesWon } : {}),
    ...(speciesPlays != null ? { speciesPlays } : {}),
  });
  // Cloud sync when signed in (best-effort; guest stays local).
  // Cloud profile still stores species + difficulty only.
  void import('../firebase/cloudProgression')
    .then((m) => m.maybeSyncPrefs(species, difficulty))
    .catch(() => undefined);
}

// Note: dynamic import avoids a hard cycle (cloudProgression → matchPrefs).
