/**
 * Friend lobbies on the Realtime Database. Every change is a transaction, so the
 * server applies the same decision from lobbyStore.ts to the latest lobby.
 * Nothing here runs in single-player; the menu reaches it only behind the
 * `multiplayerLobby` flag.
 */
import { get, getDatabase, onValue, ref, runTransaction, type Database } from 'firebase/database';
import { getFirebaseApp } from '../firebase/app';
import {
  LOBBY_PROTOCOL,
  planClose,
  planCreate,
  planJoin,
  type JoinPlan,
  type JoinReject,
  type LobbyRecord,
} from './lobbyStore';

export type JoinResult =
  | { ok: true; lobby: LobbyRecord }
  | { ok: false; reason: JoinReject | 'failed' };

export function createRealtimeLobbies(db: Database) {
  const at = (code: string) => ref(db, `lobbies/${code}`);

  return {
    /** Opens a lobby under `code`. False if somebody already holds the code. */
    async create(code: string, hostUid: string, now = Date.now()): Promise<boolean> {
      const host: LobbyRecord = { hostUid, createdAt: now, status: 'open', protocol: LOBBY_PROTOCOL };
      const result = await runTransaction(at(code), (current: LobbyRecord | null) =>
        planCreate(current, host) ?? undefined,
      );
      return result.committed;
    },

    /** Seats `guestUid` in the lobby, or says why it could not. */
    async join(code: string, guestUid: string): Promise<JoinResult> {
      const outcome: { plan?: JoinPlan } = {};
      const result = await runTransaction(at(code), (current: LobbyRecord | null) => {
        const plan = planJoin(current, guestUid);
        outcome.plan = plan;
        if ('write' in plan) return plan.write;
        // An empty local cache is not proof the lobby is gone. Writing null lets the
        // server answer with the real value and retry; a real miss commits null.
        return current === null ? null : undefined;
      });
      if (result.committed) {
        const lobby = result.snapshot.val() as LobbyRecord | null;
        return lobby ? { ok: true, lobby } : { ok: false, reason: 'missing' };
      }
      const plan = outcome.plan;
      return { ok: false, reason: plan && 'reject' in plan ? plan.reject : 'failed' };
    },

    /** Closes the lobby if `hostUid` owns it. */
    async close(code: string, hostUid: string): Promise<boolean> {
      const result = await runTransaction(at(code), (current: LobbyRecord | null) => {
        const next = planClose(current, hostUid);
        return next ?? (current === null ? null : undefined);
      });
      const lobby = result.snapshot.val() as LobbyRecord | null;
      return result.committed && lobby?.status === 'closed';
    },

    async read(code: string): Promise<LobbyRecord | null> {
      const snap = await get(at(code));
      return (snap.val() as LobbyRecord | null) ?? null;
    },

    /** Calls `onChange` with the lobby now and after each change. Returns the stop function. */
    watch(code: string, onChange: (lobby: LobbyRecord | null) => void): () => void {
      return onValue(at(code), (snap) => onChange((snap.val() as LobbyRecord | null) ?? null));
    },
  };
}

export type RealtimeLobbies = ReturnType<typeof createRealtimeLobbies>;

/** The lobbies on the project's database, or null when Firebase is not configured. */
export function getRealtimeLobbies(): RealtimeLobbies | null {
  const app = getFirebaseApp();
  return app ? createRealtimeLobbies(getDatabase(app)) : null;
}
