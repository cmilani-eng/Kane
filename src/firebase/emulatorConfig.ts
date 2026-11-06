/**
 * Emulator ports — must stay in sync with root `firebase.json` `emulators`.
 */
import type { EmulatorEndpoints } from './types';

export const EMULATOR_ENDPOINTS: EmulatorEndpoints = {
  authHost: '127.0.0.1',
  authPort: 9099,
  databaseHost: '127.0.0.1',
  databasePort: 9000,
  firestoreHost: '127.0.0.1',
  firestorePort: 8080,
};

export function emulatorSummary(ep: EmulatorEndpoints = EMULATOR_ENDPOINTS): string {
  return `auth=${ep.authHost}:${ep.authPort} rtdb=${ep.databaseHost}:${ep.databasePort} fs=${ep.firestoreHost}:${ep.firestorePort}`;
}
