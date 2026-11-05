/**
 * MULTIPLAYER SERVER — STUB.
 * Future: match state, synchronization, validation.
 * Not used by the single-player vs AI prototype.
 */

export interface MatchStateSnapshot {
  matchId: string;
  tick: number;
  hash: string;
}

export function createMatchServerStub() {
  return {
    enabled: false as const,
    role: 'match-state-sync-validation' as const,
    startMatch(_seed: string): MatchStateSnapshot {
      return { matchId: 'local-stub', tick: 0, hash: '0' };
    },
    validateCommand(_cmd: unknown): boolean {
      return false;
    },
    syncTick(_tick: number): MatchStateSnapshot | null {
      return null;
    },
  };
}

export type MatchServerStub = ReturnType<typeof createMatchServerStub>;
