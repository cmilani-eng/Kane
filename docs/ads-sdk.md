# Ads SDK stub — how it works / how to flip later

Client stub: [`src/ads/adsSdkStub.ts`](../src/ads/adsSdkStub.ts).

**Soft launch:** `flags.adsEnabled === false` (`src/config/flags.ts`). No ad network script is loaded. Menu + post-match hooks are wired but idle. **Gameplay / Battlefield does not import the stub.**

## Hook points

| Placement | When | Function |
|-----------|------|----------|
| `menu_banner` | `MenuScene.create` / shutdown | `showMenuBannerStub` / `hideMenuBannerStub` |
| `post_match_interstitial` | End-screen open | `showPostMatchInterstitialStub` |

## Flip later (Phase 5+ safer ads)

1. Change `adsEnabled` in `src/config/flags.ts` from `false as const` to a real boolean you can toggle (or env-driven `VITE_ADS_ENABLED`).
2. In `initAdsSdkStub()`, **dynamic-import** the vendor SDK only when enabled (keeps the soft-launch bundle clean).
3. Replace the `console.info` branches in `showMenuBannerStub` / `showPostMatchInterstitialStub` with real banner / interstitial APIs.
4. Keep **no ads during active battlefield play** — do not call the stub from `BattlefieldScene` combat loops.
5. Re-check privacy / 13+ positioning (no in-game gate) before serving ads to players.

Until those steps land, leave `adsEnabled=false` — Hosting preview and local Vite stay zero ad traffic.
