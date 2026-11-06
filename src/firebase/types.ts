/**
 * Shared Firebase / account types — used by stubs and live SDK modules.
 */

import type { SpeciesId } from '../data/speciesStub';
import type { AiDifficultyId } from '../gameplay/battlefield/aiDifficulty';
import type { MatchResult } from '../gameplay/battlefield/battlefieldVictory';

export type AuthProviderKind = 'anonymous' | 'google' | 'email' | 'none';

export interface KaneAuthUser {
  uid: string;
  displayName: string;
  email: string | null;
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

/** Firestore `users/{uid}` document. */
export interface UserProfileDoc {
  displayName: string;
  email: string | null;
  ageGateOk: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  prefs: {
    species: SpeciesId;
    difficulty: AiDifficultyId;
  };
  cosmetics: {
    equipped: Record<SpeciesId, string>;
  };
}

export interface SpeciesStatDoc {
  started: number;
  wins: number;
  losses: number;
}

/** Firestore `users/{uid}/statistics/overview`. */
export interface StatsOverviewDoc {
  gamesStarted: number;
  wins: number;
  losses: number;
  bySpecies: Record<SpeciesId, SpeciesStatDoc>;
  updatedAtMs: number;
}

/** Firestore `users/{uid}/matches/{matchId}`. */
export interface UserMatchDoc {
  endedAtMs: number;
  durationMs: number;
  result: Exclude<MatchResult, 'ongoing'>;
  won: boolean;
  species: SpeciesId;
  difficulty: AiDifficultyId;
  playerUnitsLeft: number;
  enemyUnitsLeft: number;
  playerBuildingsLeft: number;
  enemyBuildingsLeft: number;
  mode: 'sp_ai';
}

export function emptyStatsOverview(now = Date.now()): StatsOverviewDoc {
  const zero = (): SpeciesStatDoc => ({ started: 0, wins: 0, losses: 0 });
  return {
    gamesStarted: 0,
    wins: 0,
    losses: 0,
    bySpecies: {
      brutes: zero(),
      nobles: zero(),
      weirdos: zero(),
    },
    updatedAtMs: now,
  };
}
