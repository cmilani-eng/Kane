/**
 * DATABASE — STUB.
 * Future: accounts, progression, cosmetics, statistics.
 * Local SP prototype uses in-memory / no persistence beyond the match.
 */

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
      return null;
    },
    async saveMatchResult(_result: {
      won: boolean;
      reason: string;
    }): Promise<void> {
      // no-op
    },
  };
}

export type DatabaseStub = ReturnType<typeof createDatabaseStub>;
