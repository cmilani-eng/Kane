/**
 * Email/password Auth + session observer.
 * Falls back gracefully when SDK config is missing (guest / local SP).
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseSdkReady } from './app';
import type { KaneAuthUser } from './types';

export type AuthListener = (user: KaneAuthUser | null) => void;

function mapUser(u: User | null): KaneAuthUser | null {
  if (!u) return null;
  const provider: KaneAuthUser['provider'] = u.isAnonymous
    ? 'anonymous'
    : u.providerData.some((p) => p.providerId === 'password')
      ? 'email'
      : u.providerData.some((p) => p.providerId === 'google.com')
        ? 'google'
        : 'none';
  return {
    uid: u.uid,
    displayName:
      u.displayName?.trim() ||
      u.email?.split('@')[0] ||
      'Commander',
    email: u.email,
    isAnonymous: u.isAnonymous,
    provider,
  };
}

/** Signed-in email (non-anonymous) account — cloud progression eligible. */
export function isCloudAccount(user: KaneAuthUser | null): boolean {
  return !!user && !user.isAnonymous && user.provider === 'email';
}

export function authErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email already has an account — try Log in.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts — wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error — check connection or emulator.';
    case 'auth/missing-email':
      return 'Enter your email first.';
    default: {
      if (err instanceof Error && err.message) return err.message;
      return 'Something went wrong. Try again.';
    }
  }
}

let cached: KaneAuthUser | null = null;
let listening = false;
const listeners = new Set<AuthListener>();

function emit(user: KaneAuthUser | null): void {
  cached = user;
  for (const l of listeners) l(user);
}

function ensureListener(): void {
  if (listening) return;
  const auth = getFirebaseAuth();
  if (!auth) return;
  listening = true;
  onAuthStateChanged(auth, (u) => emit(mapUser(u)));
}

export function getCurrentAuthUser(): KaneAuthUser | null {
  ensureListener();
  if (cached) return cached;
  const auth = getFirebaseAuth();
  if (!auth) return null;
  cached = mapUser(auth.currentUser);
  return cached;
}

export function subscribeAuth(listener: AuthListener): () => void {
  ensureListener();
  listeners.add(listener);
  listener(getCurrentAuthUser());
  return () => listeners.delete(listener);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<KaneAuthUser> {
  const auth = getFirebaseAuth();
  if (!auth || !isFirebaseSdkReady()) {
    throw new Error('Firebase Auth is not configured. Add VITE_FIREBASE_* to .env.local.');
  }
  const cred = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  const name = displayName?.trim();
  if (name) {
    await updateProfile(cred.user, { displayName: name.slice(0, 32) });
  }
  const mapped = mapUser(cred.user)!;
  emit(mapped);
  return mapped;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<KaneAuthUser> {
  const auth = getFirebaseAuth();
  if (!auth || !isFirebaseSdkReady()) {
    throw new Error('Firebase Auth is not configured. Add VITE_FIREBASE_* to .env.local.');
  }
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const mapped = mapUser(cred.user)!;
  emit(mapped);
  return mapped;
}

export async function signOutAccount(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) {
    emit(null);
    return;
  }
  await signOut(auth);
  emit(null);
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth || !isFirebaseSdkReady()) {
    throw new Error('Firebase Auth is not configured. Add VITE_FIREBASE_* to .env.local.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}
