/**
 * Feature flags for Kane soft-launch posture.
 * Ads stay off through soft launch; no ad SDK is loaded while this is false.
 */
export const flags = {
  /**
   * Soft-launch: ads disabled. Do not load any ad network SDK.
   * Menu/post-match hooks live in `src/ads/adsSdkStub.ts` — see `docs/ads-sdk.md` to flip later.
   */
  adsEnabled: false as const,
  /**
   * Age positioning: kid-friendly 13+ (not under-13 / COPPA).
   * No in-game age-gate / boot confirmation screen.
   */
  ageGateMinYears: 13 as const,
  /** Unit hard cap for browser honesty. */
  unitCap: 36,
  /**
   * Phase 6 scaffolding — expose auth/lobby stubs + logging.
   * Live Auth/Firestore initialize when VITE_FIREBASE_* is configured
   * (see `src/firebase/publicConfig.ts` / `app.ts`). Guest SP still works offline.
   */
  firebaseFoundation: true as const,
  /** Prefer email Auth for Account / cloud progression when SDK ready. */
  firebaseAuthUi: true as const,
  /**
   * Friend lobby. Host and join use the live lobbies when Firebase is configured, and
   * fall back to a short "online service needed" message when it is not. Matches do
   * not start yet, so a joined lobby only shows the seat.
   */
  multiplayerLobby: true as const,
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
  /**
   * Phase 7 — admin allowlist stub for #/admin.
   * When true, `adminAccessMode` applies (`open` | `allowlist`).
   */
  adminAllowlistStub: true as const,
  /**
   * Local-dev default: `#/admin` open. Set `allowlist` (or
   * `localStorage.kane.adminAccessMode.v1` / `VITE_ADMIN_ACCESS_MODE`) to deny.
   */
  adminAccessMode: 'open' as 'open' | 'allowlist',
} as const;

export type FeatureFlags = typeof flags;
