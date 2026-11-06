/**
 * Firestore users/{uid} — profile, prefs, cosmetics.
 * Client-trusted MVP writes; rules draft must match before deploy.
 */
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { loadAgeGate } from '../ageGate';
import { getFirestoreDb } from '../app';
import type { KaneAuthUser, UserProfileDoc } from '../types';
import { emptyLoadout } from '../../database/cosmeticsLoadout';
import { loadMatchPrefs } from '../../database/matchPrefs';
import type { SpeciesId } from '../../data/speciesStub';
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { ensureStatsOverview } from './stats';

function userRef(uid: string) {
  const db = getFirestoreDb();
  if (!db) return null;
  return doc(db, 'users', uid);
}

export function defaultProfileFromAuth(user: KaneAuthUser): UserProfileDoc {
  const prefs = loadMatchPrefs();
  const cos = emptyLoadout();
  const now = Date.now();
  return {
    displayName:
      user.displayName.slice(0, 32) ||
      (user.isAnonymous ? 'Guest' : 'Commander'),
    email: user.email,
    ageGateOk: loadAgeGate().ok,
    createdAtMs: now,
    updatedAtMs: now,
    prefs: { species: prefs.species, difficulty: prefs.difficulty },
    cosmetics: { equipped: { ...cos.equipped } },
  };
}

/** Create profile + empty overview on first login; return existing otherwise. */
export async function ensureUserProfile(
  user: KaneAuthUser,
): Promise<UserProfileDoc | null> {
  const ref = userRef(user.uid);
  if (!ref) return null;
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as UserProfileDoc;
  }
  const profile = defaultProfileFromAuth(user);
  await setDoc(ref, {
    ...profile,
    // serverTimestamp for audit; clients also keep updatedAtMs numbers
    _createdAt: serverTimestamp(),
    _updatedAt: serverTimestamp(),
  });
  await ensureStatsOverview(user.uid);
  return profile;
}

export async function getUserProfile(
  uid: string,
): Promise<UserProfileDoc | null> {
  const ref = userRef(uid);
  if (!ref) return null;
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfileDoc;
}

export async function updateDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  const ref = userRef(uid);
  if (!ref) return;
  const name = displayName.trim().slice(0, 32);
  if (!name) return;
  await updateDoc(ref, {
    displayName: name,
    updatedAtMs: Date.now(),
    _updatedAt: serverTimestamp(),
  });
}

export async function syncMatchPrefsCloud(
  uid: string,
  species: SpeciesId,
  difficulty: AiDifficultyId,
): Promise<void> {
  const ref = userRef(uid);
  if (!ref) return;
  await updateDoc(ref, {
    prefs: { species, difficulty },
    updatedAtMs: Date.now(),
    _updatedAt: serverTimestamp(),
  });
}

export async function syncCosmeticsCloud(
  uid: string,
  equipped: Record<SpeciesId, string>,
): Promise<void> {
  const ref = userRef(uid);
  if (!ref) return;
  await updateDoc(ref, {
    cosmetics: { equipped },
    updatedAtMs: Date.now(),
    _updatedAt: serverTimestamp(),
  });
}
