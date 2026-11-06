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

export interface AgeGateState {
  /** Player confirmed 13+ for online features. */
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
