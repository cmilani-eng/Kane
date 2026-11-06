/**
 * Lean local stats stub — localStorage only. No Firebase Auth.
 * Counters: games started, wins/losses by species.
 */
import type { SpeciesId } from '../data/speciesStub';

const KEY = 'kane.localStats.v1';

export interface SpeciesRecord {
  started: number;
  wins: number;
  losses: number;
}

export interface LocalStats {
  version: 1;
  gamesStarted: number;
  wins: number;
  losses: number;
  bySpecies: Record<SpeciesId, SpeciesRecord>;
}

function emptySpecies(): SpeciesRecord {
  return { started: 0, wins: 0, losses: 0 };
}

export function emptyLocalStats(): LocalStats {
  return {
    version: 1,
    gamesStarted: 0,
    wins: 0,
    losses: 0,
    bySpecies: {
      brutes: emptySpecies(),
      nobles: emptySpecies(),
      weirdos: emptySpecies(),
    },
  };
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function loadLocalStats(): LocalStats {
  const base = emptyLocalStats();
  if (!canStore()) return base;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<LocalStats>;
    const merged = emptyLocalStats();
    merged.gamesStarted = Number(parsed.gamesStarted) || 0;
    merged.wins = Number(parsed.wins) || 0;
    merged.losses = Number(parsed.losses) || 0;
    for (const id of ['brutes', 'nobles', 'weirdos'] as SpeciesId[]) {
      const s = parsed.bySpecies?.[id];
      merged.bySpecies[id] = {
        started: Number(s?.started) || 0,
        wins: Number(s?.wins) || 0,
        losses: Number(s?.losses) || 0,
      };
    }
    return merged;
  } catch {
    return base;
  }
}

export function saveLocalStats(stats: LocalStats): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // quota / private mode — ignore
  }
}

export function recordGameStarted(species: SpeciesId): LocalStats {
  const s = loadLocalStats();
  s.gamesStarted += 1;
  s.bySpecies[species].started += 1;
  saveLocalStats(s);
  return s;
}

export function recordMatchResult(
  species: SpeciesId,
  won: boolean,
): LocalStats {
  const s = loadLocalStats();
  if (won) {
    s.wins += 1;
    s.bySpecies[species].wins += 1;
  } else {
    s.losses += 1;
    s.bySpecies[species].losses += 1;
  }
  saveLocalStats(s);
  return s;
}

export function resetLocalStats(): LocalStats {
  const s = emptyLocalStats();
  saveLocalStats(s);
  return s;
}

export function formatStatsSummary(stats: LocalStats = loadLocalStats()): string {
  const lines = [
    `Games played: ${stats.gamesStarted}`,
    `Wins: ${stats.wins}   ·   Losses: ${stats.losses}`,
    '',
    'By species:',
  ];
  for (const id of ['brutes', 'nobles', 'weirdos'] as SpeciesId[]) {
    const r = stats.bySpecies[id];
    lines.push(
      `  ${id}: ${r.started} played · ${r.wins}W / ${r.losses}L`,
    );
  }
  return lines.join('\n');
}

/** Hash route `#/admin` opens Stats with admin tools. */
export function wantsAdminPanel(): boolean {
  if (typeof location === 'undefined') return false;
  const h = (location.hash || '').toLowerCase();
  return h === '#/admin' || h === '#admin';
}

/** Hash routes `#/admin` or `#/stats` open the Stats panel from the menu. */
export function wantsStatsPanel(): boolean {
  if (typeof location === 'undefined') return false;
  const h = (location.hash || '').toLowerCase();
  return (
    wantsAdminPanel() || h === '#/stats' || h === '#stats'
  );
}
