/**
 * DATABASE — STUB.
 * Future: Firebase Auth + cloud progression.
 * Local SP already persists match counters via `localStats.ts` (localStorage).
 */

import {
  loadLocalStats,
  recordMatchResult,
  type LocalStats,
} from './localStats';
import type { SpeciesId } from '../data/speciesStub';

export interface PlayerProfileStub {
  displayName: string;
  cosmetics: string[];
  stats: { wins: number; losses: number };
}

export function createDatabaseStub() {
  return {
    enabled: false as const,
    stores: ['accounts', 'progression', 'cosmetics', 'statistics'] as const,
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
    peekLocalStats(): LocalStats {
      return loadLocalStats();
    },
  };
}

export type DatabaseStub = ReturnType<typeof createDatabaseStub>;
