/**
 * Firestore users/{uid}/matches/{matchId} — client-trusted SP history.
 */
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { getFirestoreDb } from '../app';
import type { UserMatchDoc } from '../types';

export async function writeUserMatch(
  uid: string,
  matchId: string,
  payload: UserMatchDoc,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, 'users', uid, 'matches', matchId);
  await setDoc(ref, payload);
}

export async function listRecentMatches(
  uid: string,
  max = 12,
): Promise<Array<UserMatchDoc & { id: string }>> {
  const db = getFirestoreDb();
  if (!db) return [];
  const col = collection(db, 'users', uid, 'matches');
  const q = query(col, orderBy('endedAtMs', 'desc'), limit(max));
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as UserMatchDoc),
    }));
  } catch (err) {
    console.warn('[KANE] listRecentMatches failed', err);
    return [];
  }
}
