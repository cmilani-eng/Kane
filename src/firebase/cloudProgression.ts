/**
 * Cloud progression facade — profile ensure, prefs/cosmetics sync, match write.
 * Only runs for signed-in email accounts. Guest / unsigned stay on localStorage.
 */
import type { SpeciesId } from '../data/speciesStub';
import type { AiDifficultyId } from '../gameplay/battlefield/aiDifficulty';
import type { MatchResult } from '../gameplay/battlefield/battlefieldVictory';
import { loadCosmeticsLoadout } from '../database/cosmeticsLoadout';
import { getCurrentAuthUser, isCloudAccount } from './auth';
import { writeUserMatch } from './firestore/matches';
import {
  applyMatchToOverview,
  recordCloudGameStarted,
} from './firestore/stats';
import {
  ensureUserProfile,
  syncCosmeticsCloud,
  syncMatchPrefsCloud,
} from './firestore/users';
import type { KaneAuthUser, UserMatchDoc, UserProfileDoc } from './types';

export async function bootstrapCloudAccount(
  user: KaneAuthUser,
): Promise<UserProfileDoc | null> {
  if (!isCloudAccount(user)) return null;
  try {
    return await ensureUserProfile(user);
  } catch (err) {
    console.warn('[KANE] ensureUserProfile failed', err);
    return null;
  }
}

export async function maybeSyncPrefs(
  species: SpeciesId,
  difficulty: AiDifficultyId,
): Promise<void> {
  const user = getCurrentAuthUser();
  if (!isCloudAccount(user)) return;
  try {
    await syncMatchPrefsCloud(user!.uid, species, difficulty);
  } catch (err) {
    console.warn('[KANE] syncMatchPrefsCloud failed', err);
  }
}

export async function maybeSyncCosmetics(): Promise<void> {
  const user = getCurrentAuthUser();
  if (!isCloudAccount(user)) return;
  try {
    const loadout = loadCosmeticsLoadout();
    await syncCosmeticsCloud(user!.uid, loadout.equipped);
  } catch (err) {
    console.warn('[KANE] syncCosmeticsCloud failed', err);
  }
}

export async function maybeRecordCloudGameStarted(
  species: SpeciesId,
): Promise<void> {
  const user = getCurrentAuthUser();
  if (!isCloudAccount(user)) return;
  try {
    await recordCloudGameStarted(user!.uid, species);
  } catch (err) {
    console.warn('[KANE] recordCloudGameStarted failed', err);
  }
}

export async function maybeWriteCloudMatch(opts: {
  id: string;
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
}): Promise<boolean> {
  const user = getCurrentAuthUser();
  if (!isCloudAccount(user)) return false;
  const payload: UserMatchDoc = {
    endedAtMs: opts.endedAtMs,
    durationMs: opts.durationMs,
    result: opts.result,
    won: opts.won,
    species: opts.species,
    difficulty: opts.difficulty,
    playerUnitsLeft: opts.playerUnitsLeft,
    enemyUnitsLeft: opts.enemyUnitsLeft,
    playerBuildingsLeft: opts.playerBuildingsLeft,
    enemyBuildingsLeft: opts.enemyBuildingsLeft,
    mode: 'sp_ai',
  };
  try {
    await writeUserMatch(user!.uid, opts.id, payload);
    await applyMatchToOverview(user!.uid, {
      species: opts.species,
      won: opts.won,
      bumpStarted: false,
    });
    return true;
  } catch (err) {
    console.warn('[KANE] cloud match write failed', err);
    return false;
  }
}
