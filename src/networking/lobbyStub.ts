/**
 * Friend-lobby codes — STUB. No RTDB / live MP sync yet.
 * Create/join are local-only; SP vs AI never calls this path.
 */
import type { AuthStub } from '../firebase/authStub';

export type LobbyStatus = 'idle' | 'hosting' | 'joining' | 'blocked';

export interface LobbyStubState {
  status: LobbyStatus;
  code: string | null;
  reason?: string;
}

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[(Math.random() * alphabet.length) | 0]!;
  }
  return out;
}

export function createLobbyStub(auth: AuthStub) {
  let state: LobbyStubState = { status: 'idle', code: null };

  return {
    enabled: false as const,
    peek(): LobbyStubState {
      return { ...state };
    },
    hostLocal(): LobbyStubState {
      if (!auth.currentUser()) auth.signInAnonymousLocal();
      state = { status: 'hosting', code: makeCode() };
      console.info('[KANE] lobby stub — hosting local code', state.code);
      return this.peek();
    },
    joinLocal(code: string): LobbyStubState {
      const cleaned = code.trim().toUpperCase();
      if (cleaned.length < 4) {
        state = {
          status: 'blocked',
          code: null,
          reason: 'Lobby code too short',
        };
        return this.peek();
      }
      if (!auth.currentUser()) auth.signInAnonymousLocal();
      state = { status: 'joining', code: cleaned };
      console.info('[KANE] lobby stub — join local code', cleaned);
      return this.peek();
    },
    leave(): LobbyStubState {
      state = { status: 'idle', code: null };
      return this.peek();
    },
  };
}

export type LobbyStub = ReturnType<typeof createLobbyStub>;
