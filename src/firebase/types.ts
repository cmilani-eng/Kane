/**
 * Shared Firebase-foundation types — no Firebase SDK required yet.
 */

export type AuthProviderKind = 'anonymous' | 'google' | 'email' | 'none';

export interface KaneAuthUser {
  uid: string;
  displayName: string;
  isAnonymous: boolean;
  provider: AuthProviderKind;
}

/** First-run boot gate outcome — stored locally. */
export type AgeGateStatus = 'pending' | 'ok' | 'blocked';

export interface AgeGateState {
  /** pending = first run; ok = 13+ confirmed; blocked = under-13. */
  status: AgeGateStatus;
  /** True when status === 'ok' (13+). */
  ok: boolean;
  confirmedAtMs: number | null;
}

export interface FirebasePublicConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  databaseURL: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface EmulatorEndpoints {
  authHost: string;
  authPort: number;
  databaseHost: string;
  databasePort: number;
  firestoreHost: string;
  firestorePort: number;
}
