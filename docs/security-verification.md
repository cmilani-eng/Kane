# Security verification (trust baseline)

The repo cannot see the live Firebase project or the GitHub settings, so some security facts can only be checked there. This page lists what the repo checks by itself, then each check that needs console access: where to look, what good looks like, and what to do if it is not. Fill in the record at the bottom in a pull request so the evidence lives with the code.

## Checked by the repo

| What | How | When |
|------|-----|------|
| Browser security headers are configured | `games/security.test.ts` reads `firebase.json` | every `npm test` |
| The live site sends those headers | `npm run check:headers -- <site url>` fetches the hub, each game (with and without the trailing slash), Privacy, Terms, the manifest and a hashed asset, and checks that a missing file under `/assets/` answers 404 | after every deploy to `dev` (a failure marks the run red but cannot undo the release) |
| The rule files cannot be opened by accident | `src/firebase/rulesGuard.test.ts`: no `if true`, no expiring test-mode rule, every grant needs sign-in, deny-by-default catch-all, root `.read` / `.write` false | every `npm test` |
| The rules do what the docs say | `rules-tests/` runs against the Firestore and Database emulators: signed-out access is denied, users reach only their own data, server-owned paths are closed | `npm run test:rules`, and the `rules` job on every pull request |

`npm run test:rules` needs Java 21 on your machine. The CI job installs it.

None of these can say what is deployed. That is what the checks below are for.

## Checks that need console access

### 1. Live Firestore rules

- **Where:** Firebase console → Firestore Database → Rules.
- **Good:** they match [`firestore.rules`](../firestore.rules): deny-by-default, no `allow … if true`, no date-based `request.time < …` rule. A project with no Firestore database also passes: nothing is exposed.
- **Not good:** a test-mode rule (`allow read, write: if request.time < timestamp.date(…)`) means anyone can read and write. Lock it by deploying the repo rules with `firebase deploy --only firestore:rules`. The file is marked a draft and the deploy workflow never deploys rules, so this deploy is your explicit decision. Run `npm run test:rules` first, and walk sign-up → profile → match write on the emulator as [firestore-security-rules.md](./firestore-security-rules.md) describes.

### 2. Live Realtime Database rules

- **Where:** Firebase console → Realtime Database → Rules (if an instance exists).
- **Good:** they match [`database.rules.json`](../database.rules.json): root `.read` and `.write` are `false`. Single-player never uses this database today ([rtdb-security-rules.md](./rtdb-security-rules.md)), so having no instance also passes.
- **Not good:** `".read": true`, `".write": true`, or a test-mode rule. Deploy the repo rules the same way (`--only database`).

### 3. Anonymous read probes

Read-only requests with no credentials. Run them after checks 1 and 2, or before, to see what is exposed now:

```bash
# Realtime Database (your database URL, from the console): expect {"error":"Permission denied"}
curl -s "https://<database-name>.firebaseio.com/.json"

# Firestore: expect 403 (or 404 when no Firestore database exists)
curl -s -o /dev/null -w '%{http_code}\n' "https://firestore.googleapis.com/v1/projects/kane-rts-game/databases/(default)/documents/users"
```

Data in either response means the database is open: fix the rules first. There is deliberately no write probe here, because against open rules it would write real data to production.

### 4. Sign-in methods

- **Where:** Firebase console → Authentication → Sign-in method.
- **Good:** only the methods the app uses are enabled ([firestore-security-rules.md](./firestore-security-rules.md) names Anonymous and Email/Password).
- **Context:** the shipped Kane bundle embeds a Firebase web config (checked on 2026-11-07), so sign-in is wired up in production.

### 5. Branch protection on `dev`

Every push to `dev` deploys to production, so a bad commit goes straight to players.

- **Check:** `gh api repos/cmilani-eng/Kane/branches/dev/protection`. A 404 "Branch not protected" means it is unprotected.
- **Good:** require a pull request before merging, require the `check` and `rules` status checks from [`ci.yml`](../.github/workflows/ci.yml), and block force pushes and deletion. Confirm the automated PR flow still passes those checks before turning it on.

### 6. Deploy service account roles

- **Where:** Google Cloud console → IAM, principal `github-action-1447520035@kane-rts-game.iam.gserviceaccount.com`.
- **Good:** the roles the workflow needs and no others. It runs `firebase deploy --only hosting:kane-web`, with no Functions and no Cloud Run rewrites, so it needs Firebase Hosting Admin; Firebase Authentication Admin, Cloud Functions Developer, Cloud Run Viewer and API Keys Viewer are candidates to remove.
- **How:** remove one role at a time, then re-run the *Deploy Hosting (dev)* job. If it fails, put the role back and note which one is needed.

### 7. Firebase web API key

- **Where:** Google Cloud console → APIs & Services → Credentials → the browser key Firebase created.
- **Good:** an application restriction to HTTP referrers: `https://kane-rts-game.web.app/*`, `https://kane-rts-game.firebaseapp.com/*`, and `http://localhost:*/*` for local work. Leave the API restrictions as Firebase set them.
- **Note:** a Firebase web key is not a secret and does not protect data (the rules do). The restriction limits misuse of the key's quota. Sign in on the live site afterwards and watch the browser console.

## Not in this baseline

A Content-Security-Policy (needs a report-only trial), App Check, a separate Hosting site for experimental games, and pinning GitHub Actions to commit SHAs. See [firebase-hosting.md](./firebase-hosting.md).

## Record

Add a row when a check is done or changes.

| Check | Date | Who | Result | Notes |
|-------|------|-----|--------|-------|
| 1. Live Firestore rules | | | | |
| 2. Live Realtime Database rules | | | | |
| 3. Anonymous read probes | 2026-11-07 | Claude, for the owner | Partial. Firestore REST returned 403 for `users`, `matches`, `profiles`, `dailyRollups` and `matchSummaries` with no credentials. Realtime Database default hosts returned 404 | Not a full check. 403 also fits a disabled Firestore API. The RTDB host was not found in the bundle, so confirm it in the console. No data was returned. |
| 4. Sign-in methods | | | | |
| 5. Branch protection on `dev` | 2026-11-07 | Claude, through the GitHub API at the owner's request | Enabled. Pull request required, `check` and `rules` required, branch must be current, force pushes and deletion blocked, admins not enforced | Read back through the API. A rejected direct push was not tested. |
| 6. Deploy service account roles | | | | |
| 7. Firebase web API key | | | | |
