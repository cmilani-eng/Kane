# Project context

## Name and purpose
KANE is a fantasy real-time strategy game. Tagline: BUILD. COMMAND. CONQUER.

## Tech stack
Phaser 4, TypeScript, and Vite. Firebase Auth and Firestore are opt-in. Checks: ESLint, Vitest, and tsc plus the Vite build.

## Current phase
Playable combat skirmish (select, move, attack). Meta screens exist: title menu, friend-lobby stub, account dashboard, email/guest auth, pause, and match-end. Live multiplayer, full economy, and buildings are later. Ads are off.

## Key constraints
Local-first. Gameplay must not import presentation. Lobby and some cloud paths are stubs and must stay visibly not live. Visual language is navy, gold, and cream. Positioning is 13+ with no in-game age gate.

## Done
A player can start a skirmish from the menu, finish it, and return. Account and lobby screens stay honest about what is not live yet.
