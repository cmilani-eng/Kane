/**
 * Phase 6 Firebase foundation bootstrap — stubs only.
 * Local SP Vite path never requires emulators or the Firebase SDK.
 */
import { flags } from '../config/flags';
import { createAuthStub, type AuthStub } from './authStub';
import { loadAgeGate, ageGateLabel } from './ageGate';
import { EMULATOR_ENDPOINTS, emulatorSummary } from './emulatorConfig';
import { envWantsEmulators, loadFirebasePublicConfig } from './publicConfig';

export interface FirebaseFoundation {
  readonly enabled: boolean;
  readonly useEmulators: boolean;
  readonly projectId: string;
  readonly adsEnabled: false;
  readonly auth: AuthStub;
  describe(): string;
}

/**
 * Build foundation handles for logging / future lobby wiring.
 * Does not import `firebase` — SDK install is a later PR.
 */
export function createFirebaseFoundation(): FirebaseFoundation {
  const cfg = loadFirebasePublicConfig();
  const useEmulators =
    flags.firebaseEmulators || envWantsEmulators();
  const auth = createAuthStub(useEmulators);

  // Local SP always has a stable anonymous identity for future lobby codes.
  if (flags.firebaseFoundation) {
    auth.signInAnonymousLocal();
  }

  return {
    enabled: flags.firebaseFoundation,
    useEmulators,
    projectId: cfg.projectId,
    adsEnabled: false,
    auth,
    describe() {
      const gate = loadAgeGate();
      return [
        `firebase foundation=${flags.firebaseFoundation ? 'on' : 'off'}`,
        `project=${cfg.projectId}`,
        `emu=${useEmulators ? emulatorSummary(EMULATOR_ENDPOINTS) : 'off'}`,
        `ads=${flags.adsEnabled}`,
        ageGateLabel(gate),
        auth.describe(),
      ].join(' · ');
    },
  };
}

export {
  confirmAgeGate,
  clearAgeGate,
  loadAgeGate,
  canUseOnlineFeatures,
  ageGateLabel,
} from './ageGate';
export { EMULATOR_ENDPOINTS } from './emulatorConfig';
export { loadFirebasePublicConfig } from './publicConfig';
