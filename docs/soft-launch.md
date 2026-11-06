# Soft-launch readiness checklist

Kane soft-launch posture: **local-first**, framed **13+** (no in-game age-gate screen), **`adsEnabled=false`**, cosmetics never pay-to-win.  
Primary playtest path remains **`npm run dev`** (Vite). Hosting preview is optional.

This doc is the honest gate before any public preview URL.

## Ready (shipped stubs)

| Area | Status | Where |
|------|--------|--------|
| Ads off | **OK** — flag `false`; SDK stub idle (menu/post-match hooks only); **no player-facing “ads off” chrome** | `flags.adsEnabled`, `src/ads/`, `docs/ads-sdk.md` |
| Age positioning | **OK** — product framed 13+ / not COPPA child-directed; **in-game AgeGate boot confirmation removed** (product decision) | `flags.ageGateMinYears`, `src/firebase/ageGate.ts` (no-op unlock helpers) |
| Hosting preview config | **OK** — `kane-web` target + `kane-preview` channel scripts (not auto-deployed) | `firebase.json`, `npm run hosting:preview`, `docs/firebase-hosting.md` |
| Admin / `#/admin` | **OK** — local stats, match summaries, daily rollup; allowlist mode defaults **open** locally; menu **Stats** is player-facing | `statsPanel`, `adminAllowlist`, `dailyStatsRollup` |
| Cosmetics | **OK** — skins catalog, local equip, in-match tint; **not purchasable**, no combat stats | `cosmeticsCatalog`, Cosmetics menu, `skinAccent` |
| Legal stubs | **OK** — Privacy / Terms placeholders linked from menu | `games/privacy.html`, `games/terms.html` |
| RTDB / Firestore rules drafts | **OK** — deny-by-default drafts documented | `database.rules.json`, `firestore.rules` |
| SP rematch loop | **OK** — species + difficulty + map prefs; end-screen + pause **Rematch** (same setup) or Return to Menu | `endScreen`, `pauseMenu`, `matchPrefs`, `rematchPrefs`, Battlefield |
| PWA manifest + icons | **OK** — Add to Home Screen stubs; **no** offline service worker yet | `public/manifest.webmanifest`, `public/icons/`, `docs/pwa.md` |
| Master volume | **OK** — mute-aware slider on menu + pause; persists `kane.masterVolume.v1` | `audioContext`, `volumeSlider`, pause/menu |
| Reduce motion | **OK** — pause toggle disables under-attack camera nudge + quiets fog scout pulses; persists `kane.reduceMotion.v1` | `motionPrefs`, `pauseMenu`, `scoutPulseDraw`, `BattlefieldScene` |
| Attention ping | **OK** — hold minimap to drop a temporary look-here mark (world + minimap); fades clearly over lifetime; no chat | `battlefieldAttentionPing`, `minimap`, help |
| End-screen recap | **OK** — standing units/buildings from match-summary `*Left` counts (no invented deaths) | `endScreen`, `end.recap` |
| Worker carry | **OK** — selection panel shows live carry `n/capacity` + resource label when workers haul | `selectionPanel`, `sel.cargo` |
| Fog last-seen | **OK** — brief fade silhouette for enemy buildings after leaving vision (~1s) | `buildingLastSeenGhost`, drawWorld |
| Incomplete build panel | **OK** — selection shows HP + live build % while a structure is under construction | `selectionPanel`, `sel.buildingPct` |
| Hero hotkey tip | **OK** — selecting a hero shows Q/W/E ability names on the selection panel | `selectionPanel`, `sel.heroHotkeys` |
| Full-load deposit | **OK** — full workers show deposit-at-Keep hint on the carry line | `selectionPanel`, `sel.cargoFull` |
| Multi-select counts | **OK** — mixed selection title lists unit types × counts | `selectionPanel`, `sel.typeCount` |
| Queue cancel flash | **OK** — canceling a train flashes the queue row + refund copy | `flashQueueCancel`, selection panel |
| Clear rally | **OK** — selection panel Clear rally resets custom rally to default | `clearBuildingRally`, `sel.clearRally` |
| Low-HP pulse | **OK** — selection HP bar/text soft-pulse under 35% (respects reduced motion) | `selectionPanel` `.is-low` |
| Resource gather tip | **OK** — selecting a node shows haul-per-trip + active gatherer count | `selectionPanel`, `sel.gatherTip*` |
| Supply near-cap tint | **OK** — Supply readout amber within 4 of cap, pink at cap (HUD + pause) | `supplyTone`, `battlefieldHud`, `pauseMenu` |
| CORE hold banner secs | **OK** — victory-hold banner shows remaining seconds clearly (Ns + “left”) | `coreVictoryBanner`, `banner.coreHold*` |
| Idle army count | **OK** — Idle army chip leads with idle combat unit count | `battlefieldHud`, `hud.idleArmy`, `countIdleMilitary` |
| Minimap double-tap flash | **OK** — brief gold wash when double-tap recenters on selection/order | `minimap`, `MINIMAP_FOCUS_FLASH_MS` |
| Help species hotkeys | **OK** — Controls help lists Formation/Mutation/Rage only for the current species | `controlsHelpPanel`, `help.formation` / `mutation` / `rage` |
| End share line | **OK** — end screen Copy result pastes one-line KANE summary (result/species/map/difficulty/clock/standing) | `endShareLine`, `end.share*` |
| Empty selection tip | **OK** — bottom panel shows brief select tip (Army / Idle / Home) when nothing is selected | `selectionPanel` `kind: empty`, `sel.empty*` |
| Placement Esc hint | **OK** — place-mode cost strip + armed title mention Esc to cancel | `hud.place`, `sel.placeArmedTitle`, `hud.hintPlace` |
| Critical alert chip | **OK** — Keep/hero under-attack chip auto-dismisses ~3.2s (does not refresh every hit) | `battlefieldUnderAttack` `chipLifeMs` |
| Menu map tip | **OK** — selected skirmish map shows a one-line flavor blurb under the map row (tall + short menus) | `MenuScene`, `menu.mapTip` |
| Account match clock | **OK** — dashboard (and Stats) recent matches show duration as mm:ss | `dashboardPanel`, `formatMatchClock`, `stats.matchLine` |
| Pause map name | **OK** — pause overlay lists map · difficulty with clock + supply | `pauseMenu`, `pause.setup` |
| Stock supply tone | **OK** — DOM stock strip uses the same near-cap/full supply tones as HUD/pause | `stockStrip`, `supplyTone` |
| End meta difficulty | **OK** — end screen meta line shows map · difficulty · mm:ss | `endScreen`, `end.meta` |
| Easy AI cushion | **OK** — Easy gives player start gold/crystal cushion + slower AI eco; menu shows a short tip only while Easy is selected | `aiDifficulty`, `MenuScene`, `createBattlefieldWorld` |
| Hard lean tip | **OK** — Hard shows a quiet leaner-start tip (same pattern as Easy); Normal stays tip-free; short/landscape menu shows the tip too | `MenuScene`, `menu.hardTip` |
| In-match tips | **OK** — coach copy covers Pause/Esc, Home, Army, Idle chip, Rematch | `battlefieldTutorial`, `tutorialCoach` |
| Friend lobby UI | **OK** — Create / Join / Leave local stub; quiet “no live sync” note; selected map flavor tip (menu parity) | `lobbyPanel`, `lobbyMapTipLine`, `lobbyStub` |
| Hub → Kane path | **OK** — picker cards link `./kane/`; hash forward + manifest start_url match `games/PATHS.md` | `hub.gamePlayHref`, `games/registry.test.ts` |
| Hub → Blob path | **OK** — picker cards link `./blob-evolution/`; Vite entry `main.js` guarded in registry tests | `hubLinks`, `games/PATHS.md` |
| Hub legal footer | **OK** — Privacy / Terms footer hrefs stay `/privacy.html` and `/terms.html` after the games/ move | `hubLegalHref`, `games/privacy.html` |
| Kane → hub back | **OK** — soft-launch strip shows `hub /`; menu ← Games returns to the picker | `softLaunchStatusStrip`, `MenuScene` `menu.games` |
| Blob → hub back | **OK** — Blob Evolution keeps a fixed ← Games link to `/` | `games/blob-evolution/index.html` `#hub-back` |
| Hub status badges | **OK** — every hub card shows Live or Soft launch from `games.json` status | `hub.ts` `statusPill`, `hub.live` / `hub.experimental` |

## Remaining gaps (honest)

1. **Hosting** — live site https://kane-rts-game.web.app (`kane-rts-game`). GHA deploy on `dev` uses `FIREBASE_SERVICE_ACCOUNT_KANE_RTS_GAME` (Firebase Hosting GitHub integration — see `docs/firebase-hosting.md`).
2. **Firebase Auth / player dashboard** — email/password + anonymous guest + Firestore `users/{uid}` path in client; requires Console Email/Password + Anonymous, **rules deploy** (draft only in repo until Cassio asks), and `VITE_FIREBASE_*` in the Hosting build env. Without env, guest SP falls back to local-only.
3. **No live multiplayer** — lobby codes and command-sync spike are local/transport stubs only.
4. **Ads SDK not bundled** — flipping `adsEnabled` still shows stub logs only (`docs/ads-sdk.md`).
5. **Admin allowlist is soft** — default `open` for local-dev; no Custom Claims / server enforcement. Admin **`#/admin`** tools are separate from menu **Stats**.
6. **Match writes are client-trusted** for SP MVP — Functions deferred; local `#/admin` summaries still device-local.
7. **Legal copy is placeholder** — not counsel-reviewed.
8. **Content depth** — three skirmish maps (Crossing / Ridge / Gap). The coach shows once, then stays quiet until Tips is turned back on. A Practice win offers Easy (same species and map); Rematch stays on Practice.
9. **CI is thin** — pull requests run lint, unit tests and the build (`.github/workflows/ci.yml`) and a push to `dev` runs the same checks before auto-deploying Hosting (see `docs/firebase-hosting.md`); there are no browser or gameplay tests yet.
10. **Cosmetics shop** — explicitly out; free unlocks only.
11. **No offline service worker** — installability stubs exist; full offline PWA is later (`docs/pwa.md`).

## Soft-launch “go” bar (minimum)

- [ ] Ads still `false` on the build you deploy
- [ ] Boot splash → Menu with **no** age-gate / 13+ confirmation screen
- [ ] SP match + **Rematch** works on a mid-range phone over LAN Vite (or preview URL)
- [ ] Easy start shows player cushion; Normal/Hard feel unchanged
- [x] Menu/pause volume persists across reload; mute still silences (`kane.masterVolume.v1`; pause Sound toggle + master volume slider)
- [ ] PWA manifest + icons load (Add to Home Screen when HTTPS/localhost)
- [ ] In-match tips mention Pause, Home, Army, Idle, Rematch
- [ ] Menu **Stats** shows player record; `#/admin` shows admin tools when allowed
- [ ] Cosmetics equip visible in-match; no power change
- [ ] Privacy/Terms links open
- [ ] Preview channel deploy smoke (when project exists) with **zero** ad network requests
- [ ] Menu/lobby chrome has **no** “ads off” / age-gate confirmation status dump

## Menu status strip

The title menu shows a one-line soft-launch strip (hosting · admin · cosmetics · vol · pwa · hub / · /kane) built by `src/presentation/ui/softLaunchStatus.ts`. Ads and age-gate flags stay out of that strip so the main experience stays clean. A ← Games footer link returns to the hub picker at `/`.
