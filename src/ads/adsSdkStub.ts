/**
 * Ads SDK stub — menu banner + post-match interstitial hooks only.
 * While `flags.adsEnabled === false`, every call is a no-op (no SDK load).
 * Gameplay / Battlefield never imports this.
 */
import { flags } from '../config/flags';
import { BRAND } from '../config/brand';

export type AdPlacement = 'menu_banner' | 'post_match_interstitial';

export interface AdShowResult {
  shown: boolean;
  placement: AdPlacement;
  reason: 'disabled' | 'stub-logged' | 'sdk-missing';
}

let menuBannerActive = false;
let initialized = false;

function enabled(): boolean {
  // `adsEnabled` is `false as const` soft-launch; keep a boolean gate for the flip later.
  return Boolean(flags.adsEnabled);
}

/** Idempotent bootstrap — never loads a network SDK while ads are off. */
export function initAdsSdkStub(): void {
  if (initialized) return;
  initialized = true;
  if (!enabled()) {
    console.info(
      `[${BRAND.name}] ads stub · adsEnabled=false · no SDK loaded (menu/post-match hooks idle)`,
    );
    return;
  }
  // Future: dynamic import of the real ad network SDK here.
  console.warn(
    `[${BRAND.name}] adsEnabled=true but no ad SDK is bundled — stub only`,
  );
}

/**
 * Menu banner hook. Safe to call on every Menu `create`; hide on shutdown.
 * No DOM / gameplay side effects while disabled.
 */
export function showMenuBannerStub(): AdShowResult {
  initAdsSdkStub();
  if (!enabled()) {
    menuBannerActive = false;
    return { shown: false, placement: 'menu_banner', reason: 'disabled' };
  }
  menuBannerActive = true;
  console.info(`[${BRAND.name}] ads stub · would show menu_banner`);
  return { shown: false, placement: 'menu_banner', reason: 'sdk-missing' };
}

export function hideMenuBannerStub(): void {
  if (!menuBannerActive) return;
  menuBannerActive = false;
  if (enabled()) {
    console.info(`[${BRAND.name}] ads stub · hide menu_banner`);
  }
}

/**
 * Post-match interstitial hook — call from end-screen only.
 * Must not block Return to Menu; no gameplay mutation.
 */
export function showPostMatchInterstitialStub(): AdShowResult {
  initAdsSdkStub();
  if (!enabled()) {
    return {
      shown: false,
      placement: 'post_match_interstitial',
      reason: 'disabled',
    };
  }
  console.info(
    `[${BRAND.name}] ads stub · would show post_match_interstitial`,
  );
  return {
    shown: false,
    placement: 'post_match_interstitial',
    reason: 'sdk-missing',
  };
}

export function adsStubStatusLine(): string {
  return `ads=${flags.adsEnabled ? 'ON(stub)' : 'off'} · sdk=not-bundled`;
}
