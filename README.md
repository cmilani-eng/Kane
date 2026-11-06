# KANE

**BUILD. COMMAND. CONQUER.**  
Fantasy Real-Time Strategy Game

Built with **[Phaser 4](https://phaser.io/phaser4)** (`phaser@^4.2.1`) + TypeScript + Vite.  
APIs: [docs.phaser.io](https://docs.phaser.io/) — do not assume Phaser 3.

> **Local-first.** Ads off (`adsEnabled=false`). Vite (`npm run dev`) is primary. Firebase Hosting preview is optional — see `docs/firebase-hosting.md`. Push/merge to **`dev`** auto-deploys Hosting via GitHub Actions once the `FIREBASE_SERVICE_ACCOUNT_KANE_RTS_STUB` secret is set (same doc).

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` (use the LAN URL for phones).

Checks: `npm run lint` (ESLint), `npm test` (Vitest), `npm run build` (type-check + bundle).

## Current milestone — combat skirmish

Playable **battlefield** (select / move / attack):

- Camera: **WASD** / arrows, **edge scroll**, **Q/E** + wheel zoom
- **Player Brutes** (Bonkers + Rock Throwers) vs **enemy** placeholders
- **LMB** select · **Shift** add/toggle · **drag** box · **RMB** attack enemy or move
- Health bars, attack range when selected, death removal, no friendly fire
- Menu → **Enter Battlefield**

**Not in this milestone:** buildings, Scrap/Core economy, production, full AI, multiplayer.

## Architecture

![How KANE should be structured](docs/kane-architecture.png)

| Layer | Path | Status |
|-------|------|--------|
| **KANE GAME CLIENT** (Phaser 4 + TS) | `src/game/`, `src/gameplay/`, `src/presentation/` | Yes |
| → Gameplay | `src/gameplay/` (+ `battlefield/` for M1) | Yes |
| → Presentation | `src/presentation/` | Yes |
| Species / units | `src/data/speciesStub.ts`, `src/data/units.ts` | Brutes combat stats |
| Resources (later) | `src/data/resources.ts` | Stub — Scrap + Core IDs |
| Battlefield combat | `src/gameplay/battlefield/` | Select/move + combat |
| Online connection | `src/networking/` | Stub (lobby codes local-only) |
| Multiplayer server | `src/server/` | Stub |
| Database | `src/database/` | Local stats + persistence stub |
| Firebase foundation | `src/firebase/` | Email Auth + Firestore account path (opt-in via env); age gate local; no live MP |

Gameplay does not import presentation. Full skirmish systems under `gameplay/` remain for later milestones; **M1 wires only** `battlefield/` + `BattlefieldScene`.

## Controls (battlefield)

| Input | Action |
|-------|--------|
| LMB | Select unit |
| Double-click a unit (or Ctrl/Cmd+click) | Select every unit of that type |
| Shift+LMB | Add / toggle select |
| LMB drag | Multi-select box |
| Ctrl+A | Select all army |
| RMB on enemy | Attack |
| RMB on ground | Move selected |
| A, then click | Attack-move |
| S | Stop |
| Ctrl+0-9 (or Alt+0-9) | Save the selection as a control group |
| 0-9 | Select a group (Shift adds); press twice to centre the camera |
| WASD / arrows | Pan |
| Edge of screen | Pan |
| Wheel / `[` `]` | Zoom |
| Esc | Cancel, then pause |
| Menu | Back to title |

Full list, and how each key maps to StarCraft, Age of Empires and C&C: [docs/hotkeys.md](docs/hotkeys.md).

## Brand

- **KANE** · **BUILD. COMMAND. CONQUER.** · Fantasy Real-Time Strategy Game

## What’s next

Phase 6: Firebase emulators + friend lobby (stubs landed; SDK + live sync later). Keep ads off.
