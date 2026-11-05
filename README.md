# Kane

Mobile-web fantasy RTS vertical slice — classic top-down select/build with **Wardstones**, **Sunkeep Kin**, and solo vs AI.

Built with **[Phaser 4](https://phaser.io/phaser4)** (`phaser@^4.2.1`) + Vite + TypeScript.

> **Local-first:** develop and play on localhost. Firebase Hosting comes later, after this slice is fun and stable. Do not deploy Firebase for this PR.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). On a phone, use your LAN IP from the Vite `--host` output.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Vite server (binds `0.0.0.0` for phone testing) |
| `npm run build` | Typecheck + production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |

## What’s in this slice

- **One map**, five capturable **Wardstones**, forage nodes, two Keeps
- **One faction:** Sunkeep Kin (player) vs a simple rival AI (Mossclan-colored stand-in)
- **Build:** Keep (starting) + Barracks
- **Units:** Lantern Scout (gather), Kin Blade (melee), Bolt Archer (ranged)
- **Economy:** Forage (food) from berries; Aura (magic) from held Wardstones
- **Win:** hold **3 of 5** Wardstones for ~2 minutes, **or** destroy the enemy Keep
- **Touch-first:** tap select, drag-from-unit box select, drag-empty pan, pinch/wheel zoom, large command bar
- **Feature flag:** `adsEnabled = false` in `src/config/flags.ts` — **no ads SDK**

## What’s out of this slice

- Firebase Auth / Hosting / RTDB / Firestore / Functions
- Online multiplayer / friend lobbies
- Second playable faction kit (Mossclan full roster)
- Fog of war polish, full tutorial campaign, cosmetics
- Ads, analytics, admin dashboard
- Production art / animation pass

## Controls (phone)

1. Tap your blue units to select (or drag a box starting on a unit).
2. Tap berries to gather · tap a Wardstone to move onto it · tap enemies to attack.
3. **Build Barracks** → tap the map to place (100 forage).
4. **Train** Blade / Archer / Scout from the bottom bar.
5. Drag empty ground to pan · pinch (or mouse wheel) to zoom.

## Project notes

- Engine: **Vite + TypeScript + [Phaser 4](https://phaser.io/phaser4)** (`phaser@^4.2.1`)
- Ship name: **Kane** (Cursor Project may still be called Gane)
- Audience framing: kid-friendly **13+** (not under-13 / COPPA)
- Monetization posture: cosmetics later; ads later behind `adsEnabled`

## Firebase later

When the slice is rematch-worthy on localhost, Phase 2 adds Firebase emulators first, then Hosting. This repo intentionally has **no** `firebase.json` yet.
