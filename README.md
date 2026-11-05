# KANE

**BUILD. COMMAND. CONQUER.**  
Fantasy Real-Time Strategy Game

Mobile-web vertical slice — classic top-down select/build with **Wardstones**, **Sunkeep Kin**, and solo vs AI.

Built with **[Phaser 4](https://phaser.io/phaser4)** (`phaser@^4.2.1`) + TypeScript + Vite.  
Engine APIs: [docs.phaser.io](https://docs.phaser.io/) (do not assume Phaser 3).  
Locked engine requirements: see project doc `kane-engine-requirements.md`. Brand: `kane-brand.md`.

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

## Architecture (`src/`)

Gameplay logic is separate from presentation. Modules match the locked engine list:

| Module | Path |
|--------|------|
| Game initialization | `game/init.ts` |
| Camera controls | `camera/rtsCamera.ts` |
| Map / tilemap | `map/mapManager.ts`, `map/tilesetAssets.ts` |
| Unit selection | `selection/selectionSystem.ts` |
| Unit movement | `movement/movementSystem.ts` |
| Pathfinding | `pathfinding/pathfinding.ts` |
| Combat | `combat/combatSystem.ts` |
| Resources | `resources/resourceSystem.ts` |
| Construction | `construction/constructionSystem.ts` |
| Production | `production/productionSystem.ts` |
| AI | `ai/aiOpponent.ts` |
| UI | `ui/domHud.ts` + scene HUD |
| Audio / animations | `audio/audioAnims.ts` |
| Multiplayer networking | `networking/multiplayerStub.ts` (**stub only**) |
| Sim facade | `sim/world.ts`, `sim/types.ts` |
| Presentation | `presentation/entityViews.ts` |

## What’s in this slice

- **One map** (Phaser tilemap + placeholder tileset sheet), five **Wardstones**, forage nodes, two Keeps
- **One faction:** Sunkeep Kin (player) vs a simple rival AI
- **Build:** Keep (starting) + Barracks · **Units:** Scout / Blade / Archer (sprite-sheet walk anims)
- **Economy:** Forage + Aura · **Win:** hold 3/5 Wardstones or destroy Keep
- **Input:** touch + **mouse/keyboard** (WASD/arrows pan, Q/E zoom, Shift box-select, 1/2/3 select kinds, B build)
- **Feature flag:** `adsEnabled = false` — **no ads SDK**
- Multiplayer: **stub only** — no online match complexity

## What’s out / gaps vs milestone

- Firebase Auth / Hosting / RTDB / Firestore / Functions
- Online multiplayer / friend lobbies (stub only)
- Full Mossclan faction kit, fog of war polish, cosmetics, ads, admin
- Production art / SFX packs (placeholder sheets in use)
- Full grid A* (current pathfinding is deterministic waypoint + soft avoid)

## Controls

**Touch:** tap select · drag-from-unit / Shift box · drag-empty pan · pinch zoom · DOM command bar  

**Desktop:** left-click select/command · Shift+drag or right-drag box · middle-drag or WASD/arrows pan · wheel or Q/E zoom · `1`/`2`/`3` select Scout/Blade/Archer · `B` build · `Esc` clear

## Brand

- Product name: **KANE**
- Tagline: **BUILD. COMMAND. CONQUER.**
- Genre: Fantasy Real-Time Strategy Game

## Firebase later

When the slice is rematch-worthy on localhost, Phase 2 adds Firebase emulators first, then Hosting. This repo intentionally has **no** `firebase.json` yet.
