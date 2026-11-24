/**
 * SATs Quest persistence. A signed-in child's progress lives in Firestore under their own
 * account (users/{uid}/sats/progress, users/{uid}/satsSessions/{id}); a copy is kept on the
 * device so play survives a dropped connection. Without Firebase (local dev, or a local
 * guest) progress stays on the device only.
 *
 * Called by: satsController.ts
 */
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { getFirestoreDb } from '../../firebase/app';
import { isCloudAccount } from '../../firebase/auth';
import type { KaneAuthUser } from '../../firebase/types';
import { newProgress, sanitiseProgress, type SatsProgress, type SatsSessionDoc } from './satsSave';

export interface SatsStore {
  /** `cloud` saves to Firestore (with a device copy); `device` only saves in this browser. */
  readonly kind: 'cloud' | 'device';
  load(): Promise<SatsProgress>;
  /** Resolves false when only the device copy could be saved. */
  save(progress: SatsProgress): Promise<boolean>;
  addSession(session: SatsSessionDoc): Promise<boolean>;
  /** Removes all SATs Quest data for this account and this device. */
  deleteAll(): Promise<boolean>;
}

const CLOUD_TIMEOUT_MS = 8_000;
const localKey = (owner: string): string => `kane.satsQuest.v1.${owner}`;

function readLocal(owner: string): unknown {
  try {
    const raw = localStorage.getItem(localKey(owner));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(owner: string, progress: SatsProgress): void {
  try {
    localStorage.setItem(localKey(owner), JSON.stringify(progress));
  } catch {
    // Private mode or full storage: the game still runs for this session.
  }
}

function clearLocal(owner: string): void {
  try {
    localStorage.removeItem(localKey(owner));
  } catch {
    // ignore
  }
}

/** Firestore waits for the server when offline; give up waiting after a few seconds. */
function withTimeout<T>(work: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out')), CLOUD_TIMEOUT_MS);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

function deviceStore(owner: string): SatsStore {
  return {
    kind: 'device',
    load: async () => sanitiseProgress(readLocal(owner), Date.now()),
    save: async (progress) => {
      writeLocal(owner, progress);
      return false;
    },
    addSession: async () => false,
    deleteAll: async () => {
      clearLocal(owner);
      return true;
    },
  };
}

function cloudStore(uid: string): SatsStore {
  const db = getFirestoreDb()!;
  const progressRef = doc(db, 'users', uid, 'sats', 'progress');
  const sessions = collection(db, 'users', uid, 'satsSessions');
  return {
    kind: 'cloud',
    load: async () => {
      const local = readLocal(uid);
      try {
        const snap = await withTimeout(getDoc(progressRef));
        if (snap.exists()) {
          const cloud = sanitiseProgress(snap.data(), Date.now());
          const device = local ? sanitiseProgress(local, Date.now()) : null;
          // A device copy saved while offline is newer than the cloud one: keep it.
          return device && device.updatedAtMs > cloud.updatedAtMs ? device : cloud;
        }
      } catch (err) {
        console.warn('[SATs Quest] cloud load failed; using this device', err);
      }
      return local ? sanitiseProgress(local, Date.now()) : newProgress(Date.now());
    },
    save: async (progress) => {
      writeLocal(uid, progress);
      try {
        await withTimeout(setDoc(progressRef, progress));
        return true;
      } catch (err) {
        console.warn('[SATs Quest] cloud save failed; kept on this device', err);
        return false;
      }
    },
    addSession: async (session) => {
      try {
        await withTimeout(setDoc(doc(sessions), session));
        return true;
      } catch (err) {
        console.warn('[SATs Quest] session save failed', err);
        return false;
      }
    },
    deleteAll: async () => {
      clearLocal(uid);
      try {
        const snap = await withTimeout(getDocs(sessions));
        for (let i = 0; i < snap.docs.length; i += 400) {
          const batch = writeBatch(db);
          for (const d of snap.docs.slice(i, i + 400)) batch.delete(d.ref);
          await withTimeout(batch.commit());
        }
        await withTimeout(deleteDoc(progressRef));
        return true;
      } catch (err) {
        console.warn('[SATs Quest] delete failed', err);
        return false;
      }
    },
  };
}

export function createSatsStore(user: KaneAuthUser | null): SatsStore {
  if (user && isCloudAccount(user) && getFirestoreDb()) return cloudStore(user.uid);
  return deviceStore(user?.uid ?? 'device');
}
