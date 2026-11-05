/**
 * Feature flags for Kane soft-launch posture.
 * Ads stay off through Phase 4; no ad SDK is loaded while this is false.
 */
export const flags = {
  /** Soft-launch / Phase 1–4: ads disabled. Do not load any ad network SDK. */
  adsEnabled: false as const,
  /** Age positioning: kid-friendly 13+ (not under-13 / COPPA). */
  ageGateMinYears: 13 as const,
  /** Unit hard cap for browser honesty. */
  unitCap: 36,
} as const;

export type FeatureFlags = typeof flags;
