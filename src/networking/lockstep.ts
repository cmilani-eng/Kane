/**
 * Lockstep for a two-player match. An order takes effect a few ticks after it is
 * given, so both clients can apply the same orders on the same tick. A client does
 * not run tick N until it has the other player's orders for N, which keeps the two
 * simulations in step without sending the whole match.
 */
import { compareBattleCommands, type BattleCommand } from '../gameplay/battlefield/battlefieldCommands';

/** Ticks between giving an order and it taking effect: 300 ms at a 50 ms step. */
export const LOCKSTEP_DELAY_TICKS = 6;

export interface LockstepTransport {
  /** Sends this player's orders that take effect on `tick` (possibly none). */
  sendOrders(tick: number, commands: readonly BattleCommand[]): void;
  /** Calls `listener` for each batch the other player sends. Returns the stop function. */
  onPeerOrders(listener: (tick: number, commands: BattleCommand[]) => void): () => void;
  sendHash(tick: number, hash: string): void;
  onPeerHash(listener: (tick: number, hash: string) => void): () => void;
}

export function createLockstep(transport: LockstepTransport, delay = LOCKSTEP_DELAY_TICKS) {
  /** Orders given here, keyed by the tick they take effect on, until that tick is sent. */
  const outbox = new Map<number, BattleCommand[]>();
  /** Orders this player sent for a tick, kept until the tick runs. */
  const sent = new Map<number, BattleCommand[]>();
  /** The other player's orders by tick, kept until the tick runs. */
  const peer = new Map<number, BattleCommand[]>();
  const peerHashes = new Map<number, string>();
  const localHashes = new Map<number, string>();

  const stopOrders = transport.onPeerOrders((tick, commands) => peer.set(tick, commands));
  const stopHashes = transport.onPeerHash((tick, hash) => peerHashes.set(tick, hash));

  return {
    /** Records an order given while `currentTick` is the next tick to run. */
    issue(currentTick: number, command: BattleCommand): void {
      const at = currentTick + delay;
      outbox.set(at, [...(outbox.get(at) ?? []), command]);
    },

    /** True once the other player's orders for `tick` have arrived, or none can be due yet. */
    canRun(tick: number): boolean {
      return tick < delay || peer.has(tick);
    },

    /**
     * Call once before running `tick`, after `canRun(tick)` is true. Sends this player's
     * orders for `tick + delay` and returns every order that takes effect on `tick`, from
     * both players. The caller applies them in the schedule's fixed order.
     */
    beginTick(tick: number): BattleCommand[] {
      const at = tick + delay;
      const mine = outbox.get(at) ?? [];
      outbox.delete(at);
      sent.set(at, mine);
      transport.sendOrders(at, mine);

      const ours = sent.get(tick) ?? [];
      sent.delete(tick);
      const theirs = peer.get(tick) ?? [];
      peer.delete(tick);
      return [...ours, ...theirs].sort(compareBattleCommands);
    },

    /** Records and sends this player's state hash for `tick`. */
    recordHash(tick: number, hash: string): void {
      localHashes.set(tick, hash);
      transport.sendHash(tick, hash);
    },

    /**
     * Compares the hashes recorded so far with the other player's. Returns the first tick
     * where they differ, or null. Ticks compared are forgotten; ticks still waiting for the
     * other player stay until they arrive.
     */
    desyncTick(): number | null {
      let mismatch: number | null = null;
      for (const [tick, hash] of [...localHashes.entries()].sort((a, b) => a[0] - b[0])) {
        const theirs = peerHashes.get(tick);
        if (theirs === undefined) continue;
        localHashes.delete(tick);
        peerHashes.delete(tick);
        if (theirs !== hash && mismatch === null) mismatch = tick;
      }
      return mismatch;
    },

    stop(): void {
      stopOrders();
      stopHashes();
    },
  };
}

export type Lockstep = ReturnType<typeof createLockstep>;
