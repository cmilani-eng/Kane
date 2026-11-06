/**
 * Public Firebase web config from Vite env — placeholders only.
 * Never put private keys / service-account JSON in the client.
 */
import type { FirebasePublicConfig } from './types';

function env(key: keyof ImportMetaEnv, fallback: string): string {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

/** Production project defaults — override with `.env.local` for real keys. */
export function loadFirebasePublicConfig(): FirebasePublicConfig {
  return {
    apiKey: env('VITE_FIREBASE_API_KEY', ''),
    authDomain: env(
      'VITE_FIREBASE_AUTH_DOMAIN',
      'kane-rts-game.firebaseapp.com',
    ),
    projectId: env('VITE_FIREBASE_PROJECT_ID', 'kane-rts-game'),
    databaseURL: env(
      'VITE_FIREBASE_DATABASE_URL',
      'https://kane-rts-game-default-rtdb.firebaseio.com',
    ),
    storageBucket: env(
      'VITE_FIREBASE_STORAGE_BUCKET',
      'kane-rts-game.appspot.com',
    ),
    messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
    appId: env('VITE_FIREBASE_APP_ID', ''),
  };
}

export function envWantsEmulators(): boolean {
  const raw = import.meta.env.VITE_FIREBASE_USE_EMULATORS;
  return raw === 'true' || raw === '1';
}

/**
 * True when client can initialize the Firebase SDK for Auth/Firestore.
 * Emulator mode needs only projectId; prod needs apiKey + appId.
 */
export function hasUsableFirebaseConfig(
  cfg: FirebasePublicConfig = loadFirebasePublicConfig(),
): boolean {
  if (!cfg.projectId) return false;
  if (envWantsEmulators()) return true;
  return Boolean(cfg.apiKey && cfg.appId);
}
