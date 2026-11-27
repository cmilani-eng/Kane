/**
 * What the friend-lobby panel shows and does: host a code, join a friend's code,
 * or leave. It talks to the lobby store and reports changes as one state object,
 * so the panel only renders. Failures come back as translation keys.
 */
import { LOBBY_CODE_LENGTH, isLobbyCode, newLobbyCode, type LobbyRecord } from './lobbyStore';
import type { RealtimeLobbies } from './lobbyRealtime';

export type SessionStatus = 'idle' | 'hosting' | 'hosted' | 'joining' | 'joined' | 'blocked';

export interface SessionState {
  status: SessionStatus;
  code: string | null;
  /** Translation key for the reason behind a blocked or closed lobby. */
  reason?: string;
  /** The friend in the lobby: the guest, for the host, and the host, for the guest. */
  peerUid?: string;
}

export interface LobbySessionDeps {
  /** Null when Firebase is not configured, so the lobby cannot reach a friend. */
  lobbies: RealtimeLobbies | null;
  /** The signed-in player's id, or null when they cannot sign in. */
  signIn: () => Promise<string | null>;
  makeCode?: () => string;
  now?: () => number;
}

const CREATE_ATTEMPTS = 3;

const OFFLINE: SessionState = { status: 'blocked', code: null, reason: 'lobby.reason.offline' };

export function createLobbySession(deps: LobbySessionDeps) {
  let state: SessionState = { status: 'idle', code: null };
  let hostUid: string | null = null;
  let stopWatching: (() => void) | null = null;
  const listeners = new Set<() => void>();
  const makeCode = deps.makeCode ?? (() => newLobbyCode());
  const now = deps.now ?? (() => Date.now());

  const set = (next: SessionState): void => {
    state = next;
    for (const listener of listeners) listener();
  };

  const stopWatchingLobby = (): void => {
    stopWatching?.();
    stopWatching = null;
  };

  /** Follows the lobby: a friend taking the seat, or the lobby going away. */
  const watchLobby = (
    lobbies: RealtimeLobbies,
    code: string,
    onLobbyGone: () => void,
    onSeated: (lobby: LobbyRecord) => void,
  ): void => {
    stopWatchingLobby();
    stopWatching = lobbies.watch(code, (lobby) => {
      if (!lobby || lobby.status === 'closed') return onLobbyGone();
      if (lobby.guestUid) onSeated(lobby);
    });
  };

  return {
    peek(): SessionState {
      return { ...state };
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** Opens a code for a friend to join. */
    async host(): Promise<void> {
      const lobbies = deps.lobbies;
      if (!lobbies) return set(OFFLINE);
      const uid = await deps.signIn();
      if (!uid) return set(OFFLINE);

      for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt++) {
        const code = makeCode();
        if (await lobbies.create(code, uid, now())) {
          hostUid = uid;
          set({ status: 'hosting', code });
          watchLobby(
            lobbies,
            code,
            () => {
              hostUid = null;
              stopWatchingLobby();
              set({ status: 'idle', code: null, reason: 'lobby.reason.closed' });
            },
            (lobby) => set({ status: 'hosted', code, peerUid: lobby.guestUid }),
          );
          return;
        }
      }
      set({ status: 'blocked', code: null, reason: 'lobby.reason.codeTaken' });
    },

    /** Seats the player in a friend's lobby. */
    async join(raw: string): Promise<void> {
      const lobbies = deps.lobbies;
      const code = raw.trim().toUpperCase();
      if (code.length < LOBBY_CODE_LENGTH) {
        return set({ status: 'blocked', code: null, reason: 'lobby.codeShort' });
      }
      if (!isLobbyCode(code)) {
        return set({ status: 'blocked', code: null, reason: 'lobby.reason.badCode' });
      }
      if (!lobbies) return set(OFFLINE);
      const uid = await deps.signIn();
      if (!uid) return set(OFFLINE);

      const result = await lobbies.join(code, uid);
      if (!result.ok) {
        const reason = result.reason === 'failed' ? 'lobby.reason.failed' : `lobby.reason.${result.reason}`;
        return set({ status: 'blocked', code: null, reason });
      }
      set({ status: 'joined', code, peerUid: result.lobby.hostUid });
      watchLobby(
        lobbies,
        code,
        () => {
          stopWatchingLobby();
          set({ status: 'idle', code: null, reason: 'lobby.reason.closedByHost' });
        },
        () => undefined,
      );
    },

    /** Stops following the lobby without closing it, for when the match starts. */
    release(): void {
      hostUid = null;
      stopWatchingLobby();
      set({ status: 'idle', code: null });
    },

    /** Closes a lobby this player hosts, or stops following one they joined. */
    async leave(): Promise<void> {
      const { code, status } = state;
      const lobbies = deps.lobbies;
      if (code && hostUid && lobbies && (status === 'hosting' || status === 'hosted')) {
        await lobbies.close(code, hostUid);
      }
      hostUid = null;
      stopWatchingLobby();
      set({ status: 'idle', code: null });
    },
  };
}

export type LobbySession = ReturnType<typeof createLobbySession>;
