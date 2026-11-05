# KANE

**BUILD. COMMAND. CONQUER.**  
Fantasy Real-Time Strategy Game

Mobile-web vertical slice — classic top-down select/build with **Wardstones**, **Sunkeep Kin**, and solo vs AI.

Built with **[Phaser 4](https://phaser.io/phaser4)** (`phaser@^4.2.1`) + TypeScript + Vite.  
Engine APIs: [docs.phaser.io](https://docs.phaser.io/) (do not assume Phaser 3).  
Locked engine requirements: project doc `kane-engine-requirements.md`. Brand: `kane-brand.md`.

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

## Architecture

Target structure (Cassio):

![How KANE should be structured](docs/kane-architecture.png)

| Layer | Role in this prototype |
|-------|------------------------|
| **KANE GAME CLIENT** (Phaser 4 + TypeScript) | Implemented |
| → **Gameplay Module** | `src/gameplay/` — units, buildings, combat, resources, AI |
| → **Presentation Module** | `src/presentation/` — maps, animations, effects, UI, audio (+ camera, scenes, views) |
| **Online multiplayer connection** | `src/networking/` — **stub** |
| **MULTIPLAYER SERVER** (match state, sync, validation) | `src/server/` — **stub** |
| **DATABASE** (accounts, progression, cosmetics, stats) | `src/database/` — **stub** |

```
src/
  game/init.ts                 # client bootstrap
  config/                      # brand, balance, flags
  gameplay/                    # GAMEPLAY MODULE
    units/   buildings/ combat/ resources/ ai/
    world.ts types.ts math.ts
  presentation/                # PRESENTATION MODULE
    maps/ animations/ effects/ ui/ audio/ camera/ views/ scenes/
  networking/                  # online connection stub
  server/                      # multiplayer server stub
  database/                    # persistence stub
```

Gameplay never imports presentation. Scenes may call into gameplay; networking/server/DB stay disabled for SP vs AI.

## What’s in this slice

- **One map** (Phaser tilemap + placeholder tileset sheet), five **Wardstones**, forage nodes, two Keeps
- **One faction:** Sunkeep Kin (player) vs a simple rival AI
- **Build:** Keep (starting) + Barracks · **Units:** Scout / Blade / Archer (sprite-sheet walk anims)
- **Economy:** Forage + Aura · **Win:** hold 3/5 Wardstones or destroy Keep
- **Input:** touch + **mouse/keyboard** (WASD/arrows pan, Q/E zoom, Shift box-select, 1/2/3 select kinds, B build)
- **Feature flag:** `adsEnabled = false` — **no ads SDK**
- Multiplayer / server / DB: **stubs only**

## What’s out / gaps vs milestone

- Live online multiplayer, match server, accounts DB
- Firebase Auth / Hosting / RTDB / Firestore / Functions
- Full Mossclan faction kit, fog polish, cosmetics, ads, admin
- Production art / SFX packs (placeholder sheets in use)
- Full grid A* (waypoint + soft avoid for now)

## Controls

**Touch:** tap select · drag-from-unit / Shift box · drag-empty pan · pinch zoom · DOM command bar  

**Desktop:** left-click select/command · Shift+drag or right-drag box · middle-drag or WASD/arrows pan · wheel or Q/E zoom · `1`/`2`/`3` select Scout/Blade/Archer · `B` build · `Esc` clear

## Brand

- Product name: **KANE**
- Tagline: **BUILD. COMMAND. CONQUER.**
- Genre: Fantasy Real-Time Strategy Game

## Firebase later

When the slice is rematch-worthy on localhost, Phase 2 adds Firebase emulators first, then Hosting. This repo intentionally has **no** `firebase.json` yet.
