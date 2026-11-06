/**
 * Firestore users/{uid}/statistics/overview — client-trusted SP counters.
 */
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { SpeciesId } from '../../data/speciesStub';
import { getFirestoreDb } from '../app';
import { emptyStatsOverview, type StatsOverviewDoc } from '../types';

function overviewRef(uid: string) {
  const db = getFirestoreDb();
  if (!db) return null;
  return doc(db, 'users', uid, 'statistics', 'overview');
}

export async function ensureStatsOverview(
  uid: string,
): Promise<StatsOverviewDoc | null> {
  const ref = overviewRef(uid);
  if (!ref) return null;
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as StatsOverviewDoc;
  const empty = emptyStatsOverview();
  await setDoc(ref, empty);
  return empty;
}

export async function getStatsOverview(
  uid: string,
): Promise<StatsOverviewDoc | null> {
  const ref = overviewRef(uid);
  if (!ref) return null;
  const snap = await getDoc(ref);
  if (!snap.exists()) return emptyStatsOverview();
  return snap.data() as StatsOverviewDoc;
}

/** Apply end-of-match deltas (and optional gamesStarted bump). */
export async function applyMatchToOverview(
  uid: string,
  opts: {
    species: SpeciesId;
    won: boolean;
    /** When true, also increment gamesStarted (guest path already counted locally at start). */
    bumpStarted?: boolean;
  },
): Promise<StatsOverviewDoc | null> {
  const ref = overviewRef(uid);
  if (!ref) return null;
  const current = (await getStatsOverview(uid)) ?? emptyStatsOverview();
  const next: StatsOverviewDoc = {
    ...current,
    bySpecies: {
      brutes: { ...current.bySpecies.brutes },
      nobles: { ...current.bySpecies.nobles },
      weirdos: { ...current.bySpecies.weirdos },
    },
    updatedAtMs: Date.now(),
  };
  if (opts.bumpStarted) {
    next.gamesStarted += 1;
    next.bySpecies[opts.species].started += 1;
  }
  if (opts.won) {
    next.wins += 1;
    next.bySpecies[opts.species].wins += 1;
  } else {
    next.losses += 1;
    next.bySpecies[opts.species].losses += 1;
  }
  await setDoc(ref, next);
  return next;
}

/** Record match start on cloud (signed-in Play). */
export async function recordCloudGameStarted(
  uid: string,
  species: SpeciesId,
): Promise<void> {
  const ref = overviewRef(uid);
  if (!ref) return;
  const current = (await getStatsOverview(uid)) ?? emptyStatsOverview();
  const next: StatsOverviewDoc = {
    ...current,
    gamesStarted: current.gamesStarted + 1,
    bySpecies: {
      brutes: { ...current.bySpecies.brutes },
      nobles: { ...current.bySpecies.nobles },
      weirdos: { ...current.bySpecies.weirdos },
    },
    updatedAtMs: Date.now(),
  };
  next.bySpecies[species].started += 1;
  await setDoc(ref, next);
}

export async function touchOverview(uid: string): Promise<void> {
  const ref = overviewRef(uid);
  if (!ref) return;
  await updateDoc(ref, { updatedAtMs: Date.now() }).catch(() => undefined);
}
