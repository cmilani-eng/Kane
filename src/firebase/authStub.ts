/**
 * Auth foundation stub — local anonymous session until Firebase Auth SDK wires in.
 * Emulator-ready surface; no network calls.
 */
import type { KaneAuthUser } from './types';

const UID_KEY = 'kane.localAuthUid.v1';

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function localUid(): string {
  if (!canStore()) return `local-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const existing = localStorage.getItem(UID_KEY);
    if (existing) return existing;
    const uid = `local-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(UID_KEY, uid);
    return uid;
  } catch {
    return `local-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export interface AuthStub {
  /** True only for the local anonymous stub path (SDK off). */
  readonly sdkEnabled: false;
  readonly usingEmulator: boolean;
  currentUser(): KaneAuthUser | null;
  /** Local anonymous identity — does not hit the network. */
  signInAnonymousLocal(): KaneAuthUser;
  signOutLocal(): void;
  /** Ready for friend lobby when a local stub user exists (still offline). */
  canEnterLobby(): boolean;
  describe(): string;
}

export function createAuthStub(usingEmulator: boolean): AuthStub {
  let user: KaneAuthUser | null = null;

  return {
    sdkEnabled: false,
    usingEmulator,
    currentUser() {
      return user;
    },
    signInAnonymousLocal() {
      user = {
        uid: localUid(),
        displayName: 'Local Commander',
        email: null,
        isAnonymous: true,
        provider: 'anonymous',
      };
      return user;
    },
    signOutLocal() {
      user = null;
    },
    canEnterLobby() {
      return user !== null;
    },
    describe() {
      const u = user;
      const who = u ? `${u.provider}:${u.uid.slice(0, 12)}` : 'signed-out';
      return `authStub sdk=off emu=${usingEmulator ? 'on' : 'off'} user=${who}`;
    },
  };
}

export type { KaneAuthUser };
