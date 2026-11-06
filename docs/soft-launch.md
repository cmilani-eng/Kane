# Soft-launch readiness checklist

Kane soft-launch posture: **local-first**, **13+**, **`adsEnabled=false`**, cosmetics never pay-to-win.  
Primary playtest path remains **`npm run dev`** (Vite). Hosting preview is optional.

This doc is the honest gate before any public preview URL.

## Ready (shipped stubs)

| Area | Status | Where |
|------|--------|--------|
| Ads off | **OK** — flag `false`; SDK stub idle (menu/post-match hooks only) | `flags.adsEnabled`, `src/ads/`, `docs/ads-sdk.md` |
| Age gate | **OK** — first-run 13+ confirm; under-13 blocked; localStorage | `AgeGateScene`, `src/firebase/ageGate.ts` |
| Hosting preview config | **OK** — `kane-web` target + `kane-preview` channel scripts (not auto-deployed) | `firebase.json`, `npm run hosting:preview`, `docs/firebase-hosting.md` |
| Admin / `#/admin` | **OK** — local stats, match summaries, daily rollup; allowlist mode defaults **open** locally | `statsPanel`, `adminAllowlist`, `dailyStatsRollup` |
| Cosmetics | **OK** — skins catalog, local equip, in-match tint; **not purchasable**, no combat stats | `cosmeticsCatalog`, Cosmetics menu, `skinAccent` |
| Legal stubs | **OK** — Privacy / Terms placeholders linked from menu | `public/privacy.html`, `public/terms.html` |
| RTDB / Firestore rules drafts | **OK** — deny-by-default drafts documented | `database.rules.json`, `firestore.rules` |
| SP rematch loop | **OK** — species + difficulty prefs; end-screen **Rematch** (same setup) or Return to Menu | `endScreen`, `matchPrefs`, Battlefield |
| PWA manifest + icons | **OK** — Add to Home Screen stubs; **no** offline service worker yet | `public/manifest.webmanifest`, `public/icons/`, `docs/pwa.md` |
| Master volume | **OK** — mute-aware slider on menu + pause; persists `kane.masterVolume.v1` | `audioContext`, `volumeSlider`, pause/menu |
| Easy AI cushion | **OK** — Easy gives player start gold/crystal cushion + slower AI eco; Normal/Hard unchanged | `aiDifficulty`, `createBattlefieldWorld` |
| In-match tips | **OK** — coach copy covers Pause/Esc, Home, Army, Idle chip, Rematch | `battlefieldTutorial`, `tutorialCoach` |

## Remaining gaps (honest)

1. **Hosting** — live site https://kane-rts-game.web.app (`kane-rts-game`). GHA deploy on `dev` needs secret `FIREBASE_SERVICE_ACCOUNT_KANE_RTS_GAME` (see `docs/firebase-hosting.md`).
2. **Firebase Auth / player dashboard** — email/password + Firestore `users/{uid}` path in client; requires Console Email/Password + **rules deploy** (draft only in repo until Cassio asks). Guest SP still works offline.
3. **No live multiplayer** — lobby codes and command-sync spike are local/transport stubs only.
4. **Ads SDK not bundled** — flipping `adsEnabled` still shows stub logs only (`docs/ads-sdk.md`).
5. **Admin allowlist is soft** — default `open` for local-dev; no Custom Claims / server enforcement. Admin **Stats** is separate from player **Account**.
6. **Match writes are client-trusted** for SP MVP — Functions deferred; local `#/admin` summaries still device-local.
7. **Legal copy is placeholder** — not counsel-reviewed.
8. **Content depth** — Phase 8 maps / deeper tutorial / practice arena not started.
9. **CI is thin** — Hosting auto-deploy on push to `dev` (see `docs/firebase-hosting.md`); other PRs may still show empty check rollups until more workflows land.
10. **Cosmetics shop** — explicitly out; free unlocks only.
11. **No offline service worker** — installability stubs exist; full offline PWA is later (`docs/pwa.md`).

## Soft-launch “go” bar (minimum)

- [ ] Ads still `false` on the build you deploy
- [ ] Age gate blocks under-13 on a clean profile
- [ ] SP match + **Rematch** works on a mid-range phone over LAN Vite (or preview URL)
- [ ] Easy start shows player cushion; Normal/Hard feel unchanged
- [ ] Menu/pause volume persists across reload; mute still silences
- [ ] PWA manifest + icons load (Add to Home Screen when HTTPS/localhost)
- [ ] In-match tips mention Pause, Home, Army, Idle, Rematch
- [ ] `#/admin` readable; destructive reset understood
- [ ] Cosmetics equip visible in-match; no power change
- [ ] Privacy/Terms links open
- [ ] Preview channel deploy smoke (when project exists) with **zero** ad network requests

## Menu status strip

The title menu shows a one-line soft-launch strip (ads · age · hosting · admin · cosmetics · vol · pwa) built by `src/presentation/ui/softLaunchStatus.ts`, so a playtester can see posture without opening docs.
