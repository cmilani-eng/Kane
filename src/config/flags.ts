/**
 * Feature flags for Kane soft-launch posture.
 * Ads stay off through soft launch; no ad SDK is loaded while this is false.
 */
export const flags = {
  /** Soft-launch: ads disabled. Do not load any ad network SDK. */
  adsEnabled: false as const,
  /** Age positioning: kid-friendly 13+ (not under-13 / COPPA). */
  ageGateMinYears: 13 as const,
  /** Unit hard cap for browser honesty. */
  unitCap: 36,
  /**
   * Phase 6 scaffolding — expose auth/lobby stubs + logging.
   * Does not enable live multiplayer or load the Firebase SDK.
   */
  firebaseFoundation: true as const,
  /**
   * Point stubs at local emulator ports (see `firebase.json`).
   * Also overridable via `VITE_FIREBASE_USE_EMULATORS=true`.
   * Local SP Vite path works with this false.
   */
  firebaseEmulators: false as const,
  /**
   * Phase 7 — Hosting preview channel config is present in-repo.
   * Does not auto-deploy; local Vite remains the primary SP path.
   */
  hostingPreviewConfig: true as const,
} as const;

export type FeatureFlags = typeof flags;
