/**
 * End-of-match summary payloads — localStorage for #/admin.
 * Cloud Function stub calls into the same write path (no live cloud yet).
 */
import type { SpeciesId } from '../data/speciesStub';
import type { AiDifficultyId } from '../gameplay/battlefield/aiDifficulty';
import type { MatchResult } from '../gameplay/battlefield/battlefieldVictory';

const KEY = 'kane.matchSummaries.v1';
const MAX = 24;

export interface MatchSummaryPayload {
  id: string;
  version: 1;
  endedAtMs: number;
  durationMs: number;
  result: Exclude<MatchResult, 'ongoing'>;
  won: boolean;
  species: SpeciesId;
  difficulty: AiDifficultyId;
  playerUnitsLeft: number;
  enemyUnitsLeft: number;
  playerBuildingsLeft: number;
  enemyBuildingsLeft: number;
  /** Always local until Functions deploy. */
  sink: 'localStorage' | 'function-stub';
}

export interface MatchSummaryStore {
  version: 1;
  summaries: MatchSummaryPayload[];
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function emptyStore(): MatchSummaryStore {
  return { version: 1, summaries: [] };
}

export function loadMatchSummaries(): MatchSummaryStore {
  if (!canStore()) return emptyStore();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<MatchSummaryStore>;
    const list = Array.isArray(parsed.summaries) ? parsed.summaries : [];
    return {
      version: 1,
      summaries: list.filter(
        (s): s is MatchSummaryPayload =>
          !!s &&
          typeof s === 'object' &&
          typeof (s as MatchSummaryPayload).id === 'string',
      ),
    };
  } catch {
    return emptyStore();
  }
}

function saveStore(store: MatchSummaryStore): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // quota / private mode
  }
}

export function makeMatchSummaryId(endedAtMs = Date.now()): string {
  return `m-${endedAtMs.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Append summary for admin panel; newest first; capped. */
export function writeMatchSummary(
  payload: MatchSummaryPayload,
): MatchSummaryStore {
  const store = loadMatchSummaries();
  store.summaries = [payload, ...store.summaries].slice(0, MAX);
  saveStore(store);
  return store;
}

export function resetMatchSummaries(): MatchSummaryStore {
  const store = emptyStore();
  saveStore(store);
  return store;
}

export function formatMatchSummaries(
  store: MatchSummaryStore = loadMatchSummaries(),
  limit = 8,
): string {
  if (store.summaries.length === 0) {
    return 'Recent matches: (none yet)';
  }
  const lines = [`Recent matches (last ${Math.min(limit, store.summaries.length)}):`];
  for (const s of store.summaries.slice(0, limit)) {
    const mins = Math.max(0, Math.round(s.durationMs / 60000));
    const secs = Math.max(0, Math.round((s.durationMs % 60000) / 1000));
    lines.push(
      `  ${s.won ? 'W' : 'L'} ${s.species}/${s.difficulty} ${mins}m${secs}s · u ${s.playerUnitsLeft}/${s.enemyUnitsLeft} · ${s.sink}`,
    );
  }
  return lines.join('\n');
}
