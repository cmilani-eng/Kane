# Kane

## Name and purpose
Kane is a fantasy real-time strategy game (KANE — BUILD. COMMAND. CONQUER.). Local-first single-player skirmish for desktop and phone.

## Tech stack
TypeScript, Phaser 4, Vite, Vitest, ESLint. Firebase Auth, Firestore, and Hosting are opt-in. Ads are off.

## Current phase
Soft-launch readiness: battlefield, economy, tutorial, menu, pause, end screen, local stats, cosmetics, and a local friend-lobby stub. No live multiplayer. Shell copy (boot, menu, pause, end, volume, and the DOM command bar), the login dialog, the friend lobby, the stats panel, the in-match HUD (resources, commands, the selection panel, the controls help sheet, the CORE and hero status lines, and the CORE hold banner), and the tutorial coach are localized. Source locale is en-GB. Also shipped: pt-BR and es (neutral Spanish). Cosmetics and the account panel are still English.

## Key constraints
Gameplay does not import presentation. The brand name and the English tagline stay fixed. Touch targets are about 48px, set in system-ui. The product is framed 13+ with no in-game age gate. Ads stay disabled. Privacy and Terms are placeholders. A missing translation falls back to en-GB for the player. The locale is stored on the device and applies immediately on the menu and pause.

## Done
On a phone-width screen the player can boot to the menu, finish a single-player match, rematch, and return. Volume and match prefs persist. Stats and cosmetics show. Privacy and Terms open. The build has no ads and no age-gate screen. The player can switch among en-GB, pt-BR, and es from the menu or pause, and that choice persists.
