/**
 * Daily match stats rollup — aggregates match summaries for #/admin.
 * LocalStorage + Function stub path; no live cloud required.
 */
import type { SpeciesId } from '../data/speciesStub';
import type { AiDifficultyId } from '../gameplay/battlefield/aiDifficulty';
import {
  loadMatchSummaries,
  type MatchSummaryPayload,
} from './matchSummary';

const KEY = 'kane.dailyRollup.v1';
const MAX_DAYS = 14;

export interface SpeciesDayCounts {
  matches: number;
  wins: number;
  losses: number;
  durationMs: number;
}

export interface DailyRollupDay {
  /** UTC calendar day YYYY-MM-DD */
  day: string;
  matches: number;
  wins: number;
  losses: number;
  durationMs: number;
  bySpecies: Record<SpeciesId, SpeciesDayCounts>;
  byDifficulty: Partial<Record<AiDifficultyId, number>>;
}

export interface DailyRollupStore {
  version: 1;
  updatedAtMs: number;
  /** Newest day first. */
  days: DailyRollupDay[];
  sink: 'localStorage' | 'function-stub';
}

function emptySpecies(): SpeciesDayCounts {
  return { matches: 0, wins: 0, losses: 0, durationMs: 0 };
}

function emptyDay(day: string): DailyRollupDay {
  return {
    day,
    matches: 0,
    wins: 0,
    losses: 0,
    durationMs: 0,
    bySpecies: {
      brutes: emptySpecies(),
      nobles: emptySpecies(),
      weirdos: emptySpecies(),
    },
    byDifficulty: {},
  };
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function utcDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function loadDailyRollup(): DailyRollupStore {
  if (!canStore()) {
    return { version: 1, updatedAtMs: 0, days: [], sink: 'localStorage' };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { version: 1, updatedAtMs: 0, days: [], sink: 'localStorage' };
    }
    const parsed = JSON.parse(raw) as Partial<DailyRollupStore>;
    return {
      version: 1,
      updatedAtMs: Number(parsed.updatedAtMs) || 0,
      days: Array.isArray(parsed.days) ? parsed.days : [],
      sink: parsed.sink === 'function-stub' ? 'function-stub' : 'localStorage',
    };
  } catch {
    return { version: 1, updatedAtMs: 0, days: [], sink: 'localStorage' };
  }
}

function saveDailyRollup(store: DailyRollupStore): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function resetDailyRollup(): DailyRollupStore {
  const store: DailyRollupStore = {
    version: 1,
    updatedAtMs: Date.now(),
    days: [],
    sink: 'localStorage',
  };
  saveDailyRollup(store);
  return store;
}

/** Rebuild rollup from all stored match summaries. */
export function rebuildDailyRollupFromSummaries(
  summaries: MatchSummaryPayload[] = loadMatchSummaries().summaries,
  sink: DailyRollupStore['sink'] = 'localStorage',
): DailyRollupStore {
  const byDay = new Map<string, DailyRollupDay>();

  for (const s of summaries) {
    const key = utcDayKey(s.endedAtMs);
    let day = byDay.get(key);
    if (!day) {
      day = emptyDay(key);
      byDay.set(key, day);
    }
    day.matches += 1;
    day.durationMs += Math.max(0, s.durationMs);
    if (s.won) day.wins += 1;
    else day.losses += 1;

    const sp = day.bySpecies[s.species];
    sp.matches += 1;
    sp.durationMs += Math.max(0, s.durationMs);
    if (s.won) sp.wins += 1;
    else sp.losses += 1;

    day.byDifficulty[s.difficulty] =
      (day.byDifficulty[s.difficulty] ?? 0) + 1;
  }

  const days = [...byDay.values()].sort((a, b) =>
    a.day < b.day ? 1 : a.day > b.day ? -1 : 0,
  );
  const store: DailyRollupStore = {
    version: 1,
    updatedAtMs: Date.now(),
    days: days.slice(0, MAX_DAYS),
    sink,
  };
  saveDailyRollup(store);
  return store;
}

export function formatDailyRollup(
  store: DailyRollupStore = loadDailyRollup(),
  limit = 5,
): string {
  if (store.days.length === 0) {
    return 'Daily rollup: (none — finish a match or run rebuild)';
  }
  const lines = [
    `Daily rollup (UTC, last ${Math.min(limit, store.days.length)})`,
  ];
  for (const d of store.days.slice(0, limit)) {
    const mins = Math.round(d.durationMs / 60000);
    lines.push(
      `  ${d.day}: ${d.matches}m ${d.wins}W/${d.losses}L · ${mins}min · B${d.bySpecies.brutes.matches}/N${d.bySpecies.nobles.matches}/W${d.bySpecies.weirdos.matches}`,
    );
  }
  return lines.join('\n');
}
