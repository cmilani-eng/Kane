# Firebase foundation (Phase 6 stubs)

Local-first Phaser build. **Ads stay off** (`adsEnabled=false`). Local SP Vite path does **not** require emulators or the Firebase SDK.

## What’s in-repo

| Piece | Path |
|-------|------|
| Hosting + emulator ports | `firebase.json` |
| Default project alias | `.firebaserc` → `kane-rts-stub` |
| RTDB rules draft | `database.rules.json` |
| Firestore rules draft | `firestore.rules` |
| Client stubs | `src/firebase/` (auth, age gate, config) |
| Lobby stub | `src/networking/lobbyStub.ts` + menu **Friends lobby** UI |
| Match summary write | `src/database/matchSummary.ts` + Function stub → `#/admin` |
| Env placeholders | `.env.example` |

## Local SP (unchanged)

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. No Firebase login needed.

## Emulators (optional — later MP work)

1. `npm i -g firebase-tools` (or `npx firebase-tools`)
2. `firebase login` (once)
3. Copy `.env.example` → `.env.local` and set `VITE_FIREBASE_USE_EMULATORS=true`
4. Start emulators: `firebase emulators:start`
5. Keep Vite on another terminal (`npm run dev`)

Emulator UI defaults to `http://127.0.0.1:4000`. Auth `9099` · RTDB `9000` · Firestore `8080`.

The client stubs log emulator intent; they do **not** open sockets until the Firebase SDK is installed in a later PR.

## Hosting deploy (after slice + emulator path are accepted)

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` serves `dist/` with SPA rewrite to `index.html` and long-cache hashed assets.

## Soft-launch guards

- `flags.adsEnabled === false` — no ad SDK
- `flags.firebaseFoundation` — stub bootstrap / console describe only
- `flags.firebaseEmulators` — off by default so phones on LAN Vite stay simple
- Age gate (`src/firebase/ageGate.ts` + `AgeGateScene`) — first-run boot confirm; under-13 blocked; 13+ unlocks Menu/SP; choice stored in `localStorage` (`kane.ageGate.v2`)
