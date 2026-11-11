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
| Legal stubs | `games/privacy.html`, `games/terms.html` (menu links) |
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
Steps: `npm ci` → `npm run lint` → `npm test` → `npm run hosting:deploy` (`npm run build` + `firebase deploy --only hosting:kane-web`; project **`kane-rts-game`** and target `kane-web` come from `.firebaserc`, CLI from the pinned `firebase-tools` devDependency) → `npm run check:headers -- https://kane-rts-game.web.app` (fetches the live site and checks the headers below; it flags a bad release but cannot undo it).

Pull requests run `.github/workflows/ci.yml` (lint, test, build, and the Firestore / Realtime Database rules against the Firebase emulators) with no secrets.

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

## Security headers and third-party scripts

Every response carries `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy` that turns off camera, microphone, geolocation, payment and USB. They come from the `"source": "**"` rule in `firebase.json` (Hosting adds HSTS itself). If a game ever needs to be embedded or to use one of those features, change that rule on purpose.

All games share one origin, and with it Kane's sign-in session, so a third-party script in any game page can read it. Today every game is bundled by Vite from npm (Phaser, three.js), so no page loads a script from a CDN. If a static game page ever does, it must pin an exact version and carry an integrity hash: `integrity` plus `crossorigin="anonymous"` on a script tag, or an `integrity` map next to `imports` in an import map. `games/security.test.ts` fails otherwise. To hash a file, stream it and compare with a second CDN (nothing needs saving):

```bash
curl -sfL https://cdn.jsdelivr.net/npm/<pkg>@<version>/<file> | openssl dgst -sha384 -binary | openssl base64 -A
curl -sfL https://unpkg.com/<pkg>@<version>/<file> | openssl dgst -sha384 -binary | openssl base64 -A
```

Prefix the result with `sha384-`, and hash every module the file imports (three.js's `three.module.js` imports `three.core.js`). Import-map integrity is only enforced by browsers that support it (current Chromium does); others skip the check and still run the game.

Missing files: `firebase.json` has no rewrites, so a path with no file returns Hosting's 404 page. A catch-all rewrite used to answer a missing `/assets/…` file with 200, the picker's HTML and a one-year `immutable` cache, which reached the browser as a script made of HTML after a deploy removed an old bundle. `games/registry.test.ts` fails if a rewrite is added that would catch a missing file, and the post-deploy check probes a missing asset. On the live site that 404 is sent with `cache-control: no-cache`, not the `immutable` header of the `/assets/**` rule, so a browser does not keep it (checked on 2026-11-07). The Hosting emulator differs: it sends `immutable` on that 404, so do not trust it for cache headers.

Not covered yet:

- A Content-Security-Policy. It needs a report-only trial first, because the Firebase SDK, the game bundles and any inline scripts or styles all have to be allowed.
- Checks that need console access: the deployed Firestore and Realtime Database rules (`firestore.rules` is marked a draft), branch protection on `dev`, the deploy account's roles, and the Firebase web API key's referrer restriction. [security-verification.md](./security-verification.md) lists each one with what good looks like and a place to record the result.

## Soft-launch guards

- `flags.adsEnabled === false` — no ad SDK / zero ad traffic on preview
- `flags.hostingPreviewConfig` — documents preview stubs; does not auto-deploy
- Local Vite remains the day-to-day SP path
- Age gate still gates first boot; under-13 blocked
- `#/admin` — `adminAccessMode=open` locally; set `allowlist` (+ `kane.adminAllowlist.v1`) for a clear deny path
