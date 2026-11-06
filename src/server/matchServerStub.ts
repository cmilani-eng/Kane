/**
 * MULTIPLAYER SERVER — STUB.
 * Phase 6: local command queue + desync hash helpers.
 * Not used by the single-player vs AI prototype path.
 */
import {
  createCommandSyncStub,
  type CommandSyncStub,
} from './commandSyncStub';
import { hashMatchSlice } from './desyncHash';

export interface MatchStateSnapshot {
  matchId: string;
  tick: number;
  hash: string;
}

export function createMatchServerStub() {
  const sync: CommandSyncStub = createCommandSyncStub();
  let matchId = 'local-stub';
  let tick = 0;

  return {
    enabled: false as const,
    role: 'match-state-sync-validation' as const,
    sync,
    startMatch(seed: string): MatchStateSnapshot {
      sync.reset();
      matchId = `local-${seed.slice(0, 8) || 'stub'}`;
      tick = 0;
      const hash = hashMatchSlice({
        tick: 0,
        unitCount: 0,
        buildingCount: 0,
        parts: [matchId, seed],
      });
      sync.recordLocalHash({
        tick: 0,
        unitCount: 0,
        buildingCount: 0,
        parts: [matchId, seed],
      });
      return { matchId, tick, hash };
    },
    validateCommand(cmd: unknown): boolean {
      if (!cmd || typeof cmd !== 'object') return false;
      const c = cmd as { tick?: unknown; kind?: unknown };
      return typeof c.tick === 'number' && typeof c.kind === 'string';
    },
    syncTick(nextTick: number): MatchStateSnapshot | null {
      tick = nextTick;
      const drained = sync.drainThrough(nextTick);
      const hash = sync.recordLocalHash({
        tick: nextTick,
        unitCount: drained.length,
        buildingCount: 0,
        parts: drained.map((d) => `${d.uid}:${d.kind}:${d.payload}`),
      });
      return { matchId, tick, hash };
    },
  };
}

export type MatchServerStub = ReturnType<typeof createMatchServerStub>;
