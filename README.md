# KANE

**BUILD. COMMAND. CONQUER.**  
Fantasy Real-Time Strategy Game

Built with **[Phaser 4](https://phaser.io/phaser4)** (`phaser@^4.2.1`) + TypeScript + Vite.  
APIs: [docs.phaser.io](https://docs.phaser.io/) — do not assume Phaser 3.

> **Local-first.** Ads off (`adsEnabled=false`). Firebase foundation is **stub-only** (emulators optional) — see `docs/firebase-hosting.md`.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` (use the LAN URL for phones).

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
| Firebase foundation | `src/firebase/` | Auth/age-gate/emulator stubs — no live MP |

Gameplay does not import presentation. Full skirmish systems under `gameplay/` remain for later milestones; **M1 wires only** `battlefield/` + `BattlefieldScene`.

## Controls (battlefield)

| Input | Action |
|-------|--------|
| LMB | Select unit |
| Shift+LMB | Add / toggle select |
| LMB drag | Multi-select box |
| RMB on enemy | Attack |
| RMB on ground | Move selected |
| WASD / arrows | Pan |
| Edge of screen | Pan |
| Q / E / wheel | Zoom |
| Esc | Clear selection |
| Menu | Back to title |

## Brand

- **KANE** · **BUILD. COMMAND. CONQUER.** · Fantasy Real-Time Strategy Game

## What’s next

Phase 6: Firebase emulators + friend lobby (stubs landed; SDK + live sync later). Keep ads off.
