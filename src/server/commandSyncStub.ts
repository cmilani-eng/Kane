/**
 * Command sync spike — queues local commands + compares tick hashes.
 * Emulator / local only. No network. SP vs AI never requires this.
 */
import { hashMatchSlice, type HashableMatchSlice } from './desyncHash';

export type SyncCommandKind =
  | 'move'
  | 'attack'
  | 'train'
  | 'build'
  | 'ability'
  | 'noop';

export interface SyncCommand {
  tick: number;
  uid: string;
  kind: SyncCommandKind;
  payload: string;
}

export interface DesyncReport {
  tick: number;
  localHash: string;
  remoteHash: string;
  desynced: boolean;
}

export function createCommandSyncStub(localUid = 'local-host') {
  const queue: SyncCommand[] = [];
  const hashes = new Map<number, string>();
  let lastDesync: DesyncReport | null = null;

  return {
    enabled: false as const,
    localUid,
    enqueue(cmd: Omit<SyncCommand, 'uid'> & { uid?: string }): SyncCommand {
      const full: SyncCommand = {
        tick: cmd.tick,
        uid: cmd.uid ?? localUid,
        kind: cmd.kind,
        payload: cmd.payload,
      };
      queue.push(full);
      return full;
    },
    drainThrough(tick: number): SyncCommand[] {
      const out: SyncCommand[] = [];
      while (queue.length > 0 && queue[0]!.tick <= tick) {
        out.push(queue.shift()!);
      }
      return out;
    },
    peekQueue(): readonly SyncCommand[] {
      return queue;
    },
    recordLocalHash(slice: HashableMatchSlice): string {
      const h = hashMatchSlice(slice);
      hashes.set(slice.tick, h);
      return h;
    },
    /**
     * Compare a peer hash for the same tick (stub injects remote).
     * Returns desync report; does not halt SP.
     */
    compareRemoteHash(tick: number, remoteHash: string): DesyncReport {
      const localHash = hashes.get(tick) ?? 'missing';
      const report: DesyncReport = {
        tick,
        localHash,
        remoteHash,
        desynced: localHash !== remoteHash,
      };
      if (report.desynced) {
        lastDesync = report;
        console.warn(
          `[KANE] desync stub tick=${tick} local=${localHash} remote=${remoteHash}`,
        );
      }
      return report;
    },
    lastDesync(): DesyncReport | null {
      return lastDesync;
    },
    reset(): void {
      queue.length = 0;
      hashes.clear();
      lastDesync = null;
    },
  };
}

export type CommandSyncStub = ReturnType<typeof createCommandSyncStub>;
