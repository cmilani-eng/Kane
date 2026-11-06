# Firebase Hosting + foundation stubs

**Local Vite is primary** (`npm run dev`). Hosting preview channels are an optional Phase 7 soft pipeline after `npm run build`. **Ads stay off** (`adsEnabled=false`).

## What’s in-repo

| Piece | Path |
|-------|------|
| Hosting target `kane-web` | `firebase.json` |
| Preview channel stub meta | `hosting/preview-channel.stub.json` |
| Project + hosting target map | `.firebaserc` → `kane-rts-game` / `kane-web` |
| Client preview constants | `src/firebase/hostingPreview.ts` |
| RTDB rules draft (deny-by-default) | `database.rules.json` + `docs/rtdb-security-rules.md` |
| Firestore rules draft | `firestore.rules` + `docs/firestore-security-rules.md` |
| Auth / lobby stubs (13+ positioning, no in-game gate) | `src/firebase/`, `src/networking/` |
| Match summary write | `src/database/matchSummary.ts` → `#/admin` |
| Daily stats rollup | `src/database/dailyStatsRollup.ts` + Function stub → `#/admin` |
| Admin allowlist stub | `src/database/adminAllowlist.ts` — `#/admin` open or allowlist + deny UI |
| Moderation stubs | `src/database/moderationStub.ts` — local report/mute log |
| Legal stubs | `public/privacy.html`, `public/terms.html` (menu links) |
| Env placeholders | `.env.example` |

## Local SP (primary — unchanged)

```bash
npm install
npm run dev
```

Open `http://localhost:5173/kane/` (LAN URL for phones). No Firebase login needed. Do **not** require Hosting to playtest.

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

## GitHub Actions — auto-deploy on `dev`

Workflow: `.github/workflows/deploy-hosting-dev.yml`  
Trigger: **push to `dev`** (covers merging a PR into `dev`).  
Steps: `npm ci` → `npm run lint` → `npm test` → `npm run hosting:deploy` (`npm run build` + `firebase deploy --only hosting:kane-web`; project **`kane-rts-game`** and target `kane-web` come from `.firebaserc`, CLI from the pinned `firebase-tools` devDependency).

Pull requests run `.github/workflows/ci.yml` (lint, test, build) with no secrets.

Local Vite (`npm run dev`) stays the day-to-day playtest path. This pipeline only publishes the Vite `dist/` bundle to Hosting.

### One-time setup (Cassio)

1. **Create the `dev` branch** if it does not exist yet (workflow targets `dev` only; it does not create the branch):
   ```bash
   git fetch origin
   git checkout main
   git pull
   git checkout -b dev
   git push -u origin dev
   ```
2. **The secret already exists.** GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_KANE_RTS_GAME` is provisioned via **Firebase Hosting ↔ GitHub** (`firebase hosting:github`) for `github-action-1447520035@kane-rts-game.iam.gserviceaccount.com`. Do not paste a new JSON over it. (The older `FIREBASE_SERVICE_ACCOUNT_KANE_RTS_STUB` name is obsolete.)
3. **Only create a key if it is missing.** If that secret is absent, Console → IAM → that service account → Keys → Add key → JSON, then store the entire JSON in the secret. Do not commit the JSON.
4. **Roles that service account has** on `kane-rts-game`:
   - `roles/firebasehosting.admin`
   - `roles/firebaseauth.admin`
   - `roles/cloudfunctions.developer`
   - `roles/run.viewer`
   - `roles/serviceusage.apiKeysViewer`
   - `roles/serviceusage.serviceUsageConsumer`

**Auth / Firestore client config (separate from the deploy key):** live Auth needs the public web-app config in the Vite build. The deploy workflow reads it from repository **secrets** with these names (names only, set the values in GitHub from Firebase console → Project settings → Your apps → Web app, never commit them): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, optional `VITE_FIREBASE_USE_EMULATORS`. Any that are unset fall back to the defaults in `src/firebase/publicConfig.ts`, which have no API key, so Auth stays off.
5. Push or merge something into `dev` and confirm the **Deploy Hosting (dev)** Action succeeds.

If the live Firebase project id is **not** `kane-rts-game`, update `.firebaserc`, the secret name in the workflow, `.env.example` and the defaults in `src/firebase/publicConfig.ts` together before relying on CI.

Optional alternative (not used by the workflow): a CI token from `firebase login:ci` as `FIREBASE_TOKEN`. Prefer the service-account JSON + `google-github-actions/auth` path above.

## Soft-launch guards

- `flags.adsEnabled === false` — no ad SDK / zero ad traffic on preview
- `flags.hostingPreviewConfig` — documents preview stubs; does not auto-deploy
- Local Vite remains the day-to-day SP path
- Age gate still gates first boot; under-13 blocked
- `#/admin` — `adminAccessMode=open` locally; set `allowlist` (+ `kane.adminAllowlist.v1`) for a clear deny path
