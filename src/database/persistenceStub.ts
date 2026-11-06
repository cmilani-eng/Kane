/**
 * DATABASE — local stub + cloud progression when signed in.
 * Guest SP: localStorage only. Email account: see `src/firebase/cloudProgression.ts`.
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
import {
  loadDailyRollup,
  type DailyRollupStore,
} from './dailyStatsRollup';
import { writeMatchSummaryFunctionStub } from '../server/matchSummaryFunctionStub';
import { rollupDailyMatchStatsFunctionStub } from '../server/dailyRollupFunctionStub';
import type { SpeciesId } from '../data/speciesStub';
import {
  loadCosmeticsLoadout,
  ownedSkinIds,
} from './cosmeticsLoadout';

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
      void loadCosmeticsLoadout();
      return {
        displayName: 'Local Commander',
        cosmetics: ownedSkinIds(),
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
    peekDailyRollup(): DailyRollupStore {
      return loadDailyRollup();
    },
    async rebuildDailyRollup(): Promise<DailyRollupStore> {
      await rollupDailyMatchStatsFunctionStub();
      return loadDailyRollup();
    },
  };
}

export type DatabaseStub = ReturnType<typeof createDatabaseStub>;
