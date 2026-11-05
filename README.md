# KANE

**BUILD. COMMAND. CONQUER.**  
Fantasy Real-Time Strategy Game

Built with **[Phaser 4](https://phaser.io/phaser4)** (`phaser@^4.2.1`) + TypeScript + Vite.  
APIs: [docs.phaser.io](https://docs.phaser.io/) — do not assume Phaser 3.

> **Local-first.** Ads off (`adsEnabled=false`). No Firebase deploy for this milestone.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` (use the LAN URL for phones).

## Milestone 1 (current) — what works

Playable **battlefield** scene (GDD v2 aligned for data only):

- Camera: **WASD** / arrows, **edge scroll**, **Q/E** + wheel zoom ([FixedKeyControl](https://docs.phaser.io/api-documentation/class/cameras-controls-fixedkeycontrol))
- Temporary **Nobles** placeholders (prototype species; ~10 units)
- **Left-click** select · **drag** multi-select · **right-click** move
- Menu → **Enter Battlefield**
- Data stubs: species Brutes / Nobles / Weirdos; resources **Scrap** + **Core** (`src/data/`)

**Not in this milestone:** combat, gather/spend economy, buildings, full species systems, AI, multiplayer.

## Architecture

![How KANE should be structured](docs/kane-architecture.png)

| Layer | Path | Status |
|-------|------|--------|
| **KANE GAME CLIENT** (Phaser 4 + TS) | `src/game/`, `src/gameplay/`, `src/presentation/` | Yes |
| → Gameplay | `src/gameplay/` (+ `battlefield/` for M1) | Yes |
| → Presentation | `src/presentation/` | Yes |
| Species data (later) | `src/data/speciesStub.ts` | Stub — Nobles first |
| Resources (later) | `src/data/resources.ts` | Stub — Scrap + Core IDs |
| Online connection | `src/networking/` | Stub |
| Multiplayer server | `src/server/` | Stub |
| Database | `src/database/` | Stub |

Gameplay does not import presentation. Full skirmish systems under `gameplay/` remain for later milestones; **M1 wires only** `battlefield/` + `BattlefieldScene`.

## Controls (battlefield)

| Input | Action |
|-------|--------|
| LMB | Select unit |
| LMB drag | Multi-select box |
| RMB | Move selected |
| WASD / arrows | Pan |
| Edge of screen | Pan |
| Q / E / wheel | Zoom |
| Esc | Clear selection |
| Menu | Back to title |

## Brand

- **KANE** · **BUILD. COMMAND. CONQUER.** · Fantasy Real-Time Strategy Game

## What’s next (not this PR milestone)

Combat, economy, buildings, data-driven Brutes/Nobles/Weirdos, AI skirmish, then online.
