/**
 * DATABASE — STUB.
 * Phase 6: Auth / Firestore profiles stay stubbed; see `src/firebase/`.
 * Local SP persists counters + match summaries via localStorage.
 */

import {
  loadLocalStats,
  recordMatchResult,
  type LocalStats,
} from './localStats';
import {
  loadMatchSummaries,
  type MatchSummaryPayload,
  type MatchSummaryStore,
} from './matchSummary';
import { writeMatchSummaryFunctionStub } from '../server/matchSummaryFunctionStub';
import type { SpeciesId } from '../data/speciesStub';

export interface PlayerProfileStub {
  displayName: string;
  cosmetics: string[];
  stats: { wins: number; losses: number };
}

export function createDatabaseStub() {
  return {
    enabled: false as const,
    stores: [
      'accounts',
      'progression',
      'cosmetics',
      'statistics',
      'matchSummaries',
    ] as const,
    async getProfile(_uid: string): Promise<PlayerProfileStub | null> {
      const local = loadLocalStats();
      return {
        displayName: 'Local Commander',
        cosmetics: [],
        stats: { wins: local.wins, losses: local.losses },
      };
    },
    async saveMatchResult(result: {
      won: boolean;
      reason: string;
      species?: SpeciesId;
    }): Promise<void> {
      if (result.species) recordMatchResult(result.species, result.won);
    },
    /** End-of-match summary → Function stub → localStorage for #/admin. */
    async writeMatchSummary(
      payload: Omit<MatchSummaryPayload, 'sink'> & {
        sink?: MatchSummaryPayload['sink'];
      },
    ): Promise<void> {
      // Function stub also bumps win/loss counters.
      await writeMatchSummaryFunctionStub(payload);
    },
    peekLocalStats(): LocalStats {
      return loadLocalStats();
    },
    peekMatchSummaries(): MatchSummaryStore {
      return loadMatchSummaries();
    },
  };
}

export type DatabaseStub = ReturnType<typeof createDatabaseStub>;
