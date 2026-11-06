# Firebase Hosting + foundation stubs

**Local Vite is primary** (`npm run dev`). Hosting preview channels are an optional Phase 7 soft pipeline after `npm run build`. **Ads stay off** (`adsEnabled=false`).

## What’s in-repo

| Piece | Path |
|-------|------|
| Hosting target `kane-web` | `firebase.json` |
| Preview channel stub meta | `hosting/preview-channel.stub.json` |
| Project + hosting target map | `.firebaserc` → `kane-rts-stub` / `kane-web` |
| Client preview constants | `src/firebase/hostingPreview.ts` |
| RTDB / Firestore rules drafts | `database.rules.json`, `firestore.rules` |
| Auth / age gate / lobby stubs | `src/firebase/`, `src/networking/` |
| Match summary write | `src/database/matchSummary.ts` → `#/admin` |
| Env placeholders | `.env.example` |

## Local SP (primary — unchanged)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` (LAN URL for phones). No Firebase login needed. Do **not** require Hosting to playtest.

Local static check of the production bundle (still not Firebase):

```bash
npm run build
npm run preview
```

## Hosting preview channel (optional)

After tools login + a real Firebase project alias in `.firebaserc`:

```bash
npm run hosting:preview
# → firebase hosting:channel:deploy kane-preview --expires 7d --only kane-web
```

List channels:

```bash
npm run hosting:channels
```

Live hosting (only when preview path is accepted):

```bash
npm run hosting:deploy
```

Channel id / expiry defaults live in `hosting/preview-channel.stub.json` and `HOSTING_PREVIEW` in `src/firebase/hostingPreview.ts`.

## Emulators (optional — MP / Auth work)

1. `npm i -g firebase-tools` (or `npx firebase-tools`)
2. `firebase login` (once)
3. Copy `.env.example` → `.env.local` and set `VITE_FIREBASE_USE_EMULATORS=true`
4. `npm run emulators` + `npm run dev` in another terminal

Emulator UI: `http://127.0.0.1:4000` · Auth `9099` · RTDB `9000` · Firestore `8080`.

## Soft-launch guards

- `flags.adsEnabled === false` — no ad SDK / zero ad traffic on preview
- `flags.hostingPreviewConfig` — documents preview stubs; does not auto-deploy
- Local Vite remains the day-to-day SP path
- Age gate still gates first boot; under-13 blocked
