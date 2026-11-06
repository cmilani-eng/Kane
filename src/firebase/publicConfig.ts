/**
 * Public Firebase web config from Vite env — placeholders only.
 * Never put private keys / service-account JSON in the client.
 */
import type { FirebasePublicConfig } from './types';

function env(key: keyof ImportMetaEnv, fallback: string): string {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

/** Demo / emulator-friendly defaults — safe for local SP without `.env`. */
export function loadFirebasePublicConfig(): FirebasePublicConfig {
  return {
    apiKey: env('VITE_FIREBASE_API_KEY', 'demo-api-key'),
    authDomain: env(
      'VITE_FIREBASE_AUTH_DOMAIN',
      'kane-rts-stub.firebaseapp.com',
    ),
    projectId: env('VITE_FIREBASE_PROJECT_ID', 'kane-rts-stub'),
    databaseURL: env(
      'VITE_FIREBASE_DATABASE_URL',
      'http://127.0.0.1:9000?ns=kane-rts-stub',
    ),
    storageBucket: env(
      'VITE_FIREBASE_STORAGE_BUCKET',
      'kane-rts-stub.appspot.com',
    ),
    messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID', '0'),
    appId: env('VITE_FIREBASE_APP_ID', '1:0:web:demo'),
  };
}

export function envWantsEmulators(): boolean {
  const raw = import.meta.env.VITE_FIREBASE_USE_EMULATORS;
  return raw === 'true' || raw === '1';
}
