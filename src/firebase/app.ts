/**
 * Lazy Firebase App / Auth / Firestore bootstrap.
 * No network until Auth or Firestore APIs are used.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import { EMULATOR_ENDPOINTS } from './emulatorConfig';
import {
  envWantsEmulators,
  hasUsableFirebaseConfig,
  loadFirebasePublicConfig,
} from './publicConfig';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let emulatorsWired = false;

export function isFirebaseSdkReady(): boolean {
  return hasUsableFirebaseConfig();
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!hasUsableFirebaseConfig()) return null;
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }
  const cfg = loadFirebasePublicConfig();
  app = initializeApp({
    apiKey: cfg.apiKey || 'demo-api-key',
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    ...(cfg.databaseURL ? { databaseURL: cfg.databaseURL } : {}),
    storageBucket: cfg.storageBucket,
    messagingSenderId: cfg.messagingSenderId || '0',
    appId: cfg.appId || '1:0:web:demo',
  });
  return app;
}

function wireEmulators(a: Auth, f: Firestore): void {
  if (emulatorsWired || !envWantsEmulators()) return;
  connectAuthEmulator(
    a,
    `http://${EMULATOR_ENDPOINTS.authHost}:${EMULATOR_ENDPOINTS.authPort}`,
    { disableWarnings: true },
  );
  connectFirestoreEmulator(
    f,
    EMULATOR_ENDPOINTS.firestoreHost,
    EMULATOR_ENDPOINTS.firestorePort,
  );
  emulatorsWired = true;
}

export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!auth) auth = getAuth(a);
  const f = getFirestore(a);
  if (!db) db = f;
  wireEmulators(auth, f);
  return auth;
}

export function getFirestoreDb(): Firestore | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!db) db = getFirestore(a);
  const au = getAuth(a);
  if (!auth) auth = au;
  wireEmulators(au, db);
  return db;
}
