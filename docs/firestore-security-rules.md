# Firestore security rules — draft assumptions

Source: [`firestore.rules`](../firestore.rules). Paired with RTDB draft in [`rtdb-security-rules.md`](./rtdb-security-rules.md).

**Deny-by-default:** catch-all `match /{document=**}` denies everything; named collections opt in.

**DRAFT ONLY — do not deploy without Cassio’s explicit ask.** Validate with the Firestore emulator first.

Production project target: **`kane-rts-game`** (repo retargeted from `kane-rts-stub`).

## Collections (SP accounts MVP)

| Path | Client |
|------|--------|
| `users/{uid}` | Self read/create/update (profile, prefs, cosmetics allowlist) |
| `users/{uid}/matches/{matchId}` | Self read/create; **no update/delete** |
| `users/{uid}/statistics/overview` | Self read/create/update (counter shapes) |
| `profiles/{uid}` | Legacy draft — self read/write (tight allowlist) |
| `matchSummaries/{id}` | Read if `uid` in `playerUids`; **no client write** |
| `dailyRollups/{day}` | Auth read; **no client write** (Function/Admin) |
| `moderationEvents/{id}` | **Denied** until admin Custom Claims |

## Assumptions

1. **Client-trusted SP writes** for matches + overview in MVP. Players can inflate their own stats; move to Cloud Functions when competitive integrity matters.
2. Product is framed 13+; the in-game age-gate screen was removed. `users.ageGateOk` / `profiles.ageGateOk` remain schema mirror flags only (client sets `true`).
3. Cosmetics are **skins-only** string ids — rules do not prove catalog validity beyond string length.
4. **Anonymous Auth** and **Email/Password** share the same `isSelf(uid)` rules — any signed-in `request.auth.uid` may read/write their own `users/{uid}` tree. Local-only guests (no Firebase env / SDK off) stay on **localStorage** and never hit Firestore.
5. Ads stay off; no analytics collection rules here yet.
6. Daily rollup + top-level match summary **writes** remain trusted (Admin SDK / Cloud Functions) when those paths are used.
7. Validate with Firestore emulator before any prod rules deploy.

## How to validate later

```bash
firebase emulators:start --only auth,firestore
# Point .env.local at emulators (VITE_FIREBASE_USE_EMULATORS=true)
# Exercise signup → profile create → match write → dashboard read.
```
