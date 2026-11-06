/**
 * Public Firebase web config from Vite env — placeholders only.
 * Never put private keys / service-account JSON in the client.
 */
import type { FirebasePublicConfig } from './types';

function env(key: keyof ImportMetaEnv, fallback: string): string {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

/**
 * RTDB URL for the client. A production build never falls back to the local
 * emulator URL; that string stays out of the bundle unless this function is
 * actually called, which the production branch does not do.
 */
export function clientDatabaseURL(input: {
  fromEnv: string;
  production: boolean;
  useEmulators: boolean;
  projectId: string;
}): string {
  if (input.fromEnv) return input.fromEnv;
  if (input.production || !input.useEmulators) return '';
  return `http://127.0.0.1:9000?ns=${input.projectId}`;
}

/**
 * Production project defaults — override with `.env.local` for real keys.
 * `apiKey`, `messagingSenderId`, and `appId` are left empty: they come from
 * the Firebase web app and must not be invented here.
 */
export function loadFirebasePublicConfig(): FirebasePublicConfig {
  const projectId = env('VITE_FIREBASE_PROJECT_ID', 'kane-rts-game');
  const fromEnv = env('VITE_FIREBASE_DATABASE_URL', '');
  return {
    apiKey: env('VITE_FIREBASE_API_KEY', ''),
    authDomain: env(
      'VITE_FIREBASE_AUTH_DOMAIN',
      'kane-rts-game.firebaseapp.com',
    ),
    projectId,
    databaseURL: import.meta.env.PROD
      ? fromEnv
      : clientDatabaseURL({
          fromEnv,
          production: false,
          useEmulators: envWantsEmulators(),
          projectId,
        }),
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
