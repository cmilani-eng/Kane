/**
 * Email/password + anonymous Auth + session observer.
 * Falls back gracefully when SDK config is missing (local-only guest SP).
 */
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { t, type MessageKey } from '../i18n';
import { getFirebaseAuth, isFirebaseSdkReady } from './app';
import type { KaneAuthUser } from './types';

export type AuthListener = (user: KaneAuthUser | null) => void;

const GUEST_DISPLAY_NAME = 'Guest';

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
      (u.isAnonymous ? GUEST_DISPLAY_NAME : u.email?.split('@')[0] || 'Commander'),
    email: u.email,
    isAnonymous: u.isAnonymous,
    provider,
  };
}

/**
 * Firebase Auth session (email or anonymous) — cloud progression eligible
 * under `users/{uid}` when rules allow. Local stub guests never appear here.
 */
export function isCloudAccount(user: KaneAuthUser | null): boolean {
  return !!user && (user.provider === 'email' || user.provider === 'anonymous');
}

/** True for Firebase anonymous guests (not email-linked). */
export function isAnonymousGuest(user: KaneAuthUser | null): boolean {
  return !!user && user.isAnonymous && user.provider === 'anonymous';
}

function authErrorKey(code: string): MessageKey | null {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'auth.errEmailInUse';
    case 'auth/invalid-email':
      return 'auth.errInvalidEmail';
    case 'auth/weak-password':
      return 'auth.errWeakPassword';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'auth.errBadCredential';
    case 'auth/too-many-requests':
      return 'auth.errTooMany';
    case 'auth/network-request-failed':
      return 'auth.errNetwork';
    case 'auth/missing-email':
      return 'auth.errMissingEmail';
    case 'auth/operation-not-allowed':
      return 'auth.errNotAllowed';
    case 'auth/credential-already-in-use':
      return 'auth.errCredentialInUse';
    default:
      return null;
  }
}

export function authErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  const key = authErrorKey(code);
  if (key) return t(key);
  if (err instanceof Error && err.message) return err.message;
  return t('auth.errGeneric');
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

/**
 * Firebase anonymous guest — real Auth UID for cloud `users/{uid}` paths.
 * Reuses an existing anonymous session when present.
 */
export async function signInAsGuest(): Promise<KaneAuthUser> {
  const auth = getFirebaseAuth();
  if (!auth || !isFirebaseSdkReady()) {
    throw new Error('Firebase Auth is not configured. Add VITE_FIREBASE_* to .env.local.');
  }
  if (auth.currentUser?.isAnonymous) {
    if (!auth.currentUser.displayName?.trim()) {
      await updateProfile(auth.currentUser, { displayName: GUEST_DISPLAY_NAME });
    }
    const mapped = mapUser(auth.currentUser)!;
    mapped.displayName = mapped.displayName || GUEST_DISPLAY_NAME;
    emit(mapped);
    return mapped;
  }
  const cred = await signInAnonymously(auth);
  await updateProfile(cred.user, { displayName: GUEST_DISPLAY_NAME });
  const mapped = mapUser(cred.user)!;
  mapped.displayName = GUEST_DISPLAY_NAME;
  emit(mapped);
  return mapped;
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
  const trimmedEmail = email.trim();
  const name = displayName?.trim();
  // Upgrade anonymous guest in place so cloud `users/{uid}` history is kept.
  let user: User;
  if (auth.currentUser?.isAnonymous) {
    const linked = await linkWithCredential(
      auth.currentUser,
      EmailAuthProvider.credential(trimmedEmail, password),
    );
    user = linked.user;
  } else {
    const cred = await createUserWithEmailAndPassword(
      auth,
      trimmedEmail,
      password,
    );
    user = cred.user;
  }
  if (name) {
    await updateProfile(user, { displayName: name.slice(0, 32) });
  }
  const mapped = mapUser(user)!;
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
