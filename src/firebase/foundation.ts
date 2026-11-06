/**
 * Firebase foundation bootstrap — live SDK when configured, else local stubs.
 * Local SP Vite path never requires emulators or real keys (guest play).
 */
import { flags } from '../config/flags';
import { createAuthStub, type AuthStub } from './authStub';
import { loadAgeGate, ageGateLabel } from './ageGate';
import {
  getCurrentAuthUser,
  isCloudAccount,
  subscribeAuth,
} from './auth';
import { isFirebaseSdkReady } from './app';
import { bootstrapCloudAccount } from './cloudProgression';
import { EMULATOR_ENDPOINTS, emulatorSummary } from './emulatorConfig';
import { hostingPreviewLabel } from './hostingPreview';
import {
  envWantsEmulators,
  loadFirebasePublicConfig,
} from './publicConfig';

export interface FirebaseFoundation {
  readonly enabled: boolean;
  readonly useEmulators: boolean;
  readonly sdkReady: boolean;
  readonly projectId: string;
  readonly adsEnabled: false;
  /** Local anonymous stub (lobby). Live email user via getCurrentAuthUser(). */
  readonly auth: AuthStub;
  describe(): string;
}

let singleton: FirebaseFoundation | null = null;

/**
 * Build foundation handles for logging / menu wiring.
 * Initializes Auth observer when SDK config is present.
 */
export function createFirebaseFoundation(): FirebaseFoundation {
  if (singleton) return singleton;

  const cfg = loadFirebasePublicConfig();
  const useEmulators =
    flags.firebaseEmulators || envWantsEmulators();
  const sdkReady = isFirebaseSdkReady();
  const auth = createAuthStub(useEmulators);

  if (sdkReady) {
    // Live email sessions — do not force local anonymous.
    subscribeAuth((user) => {
      if (isCloudAccount(user) && user) {
        void bootstrapCloudAccount(user);
      }
    });
  } else if (flags.firebaseFoundation) {
    // Offline stub identity for lobby codes / soft-launch strip.
    auth.signInAnonymousLocal();
  }

  singleton = {
    enabled: flags.firebaseFoundation,
    useEmulators,
    sdkReady,
    projectId: cfg.projectId,
    adsEnabled: false,
    auth,
    describe() {
      const gate = loadAgeGate();
      const live = getCurrentAuthUser();
      const liveBit = sdkReady
        ? live
          ? `auth=${live.provider}:${live.uid.slice(0, 8)}`
          : 'auth=signed-out'
        : auth.describe();
      return [
        `firebase foundation=${flags.firebaseFoundation ? 'on' : 'off'}`,
        `sdk=${sdkReady ? 'ready' : 'off'}`,
        `project=${cfg.projectId}`,
        `emu=${useEmulators ? emulatorSummary(EMULATOR_ENDPOINTS) : 'off'}`,
        hostingPreviewLabel(),
        `ads=${flags.adsEnabled}`,
        ageGateLabel(gate),
        liveBit,
      ].join(' · ');
    },
  };
  return singleton;
}

/** Shared handle for menu / lobby UI — same instance as bootstrap. */
export function getFirebaseFoundation(): FirebaseFoundation {
  return createFirebaseFoundation();
}

export {
  confirmAgeGate,
  blockUnder13,
  clearAgeGate,
  loadAgeGate,
  canEnterGame,
  canUseOnlineFeatures,
  ageGateLabel,
} from './ageGate';
export { EMULATOR_ENDPOINTS } from './emulatorConfig';
export { loadFirebasePublicConfig } from './publicConfig';
