# Firestore security rules — draft assumptions

Source: [`firestore.rules`](../firestore.rules). Paired with RTDB draft in [`rtdb-security-rules.md`](./rtdb-security-rules.md).

**Deny-by-default:** catch-all `match /{document=**}` denies everything; named collections opt in.

## Collections

| Collection | Client |
|------------|--------|
| `profiles/{uid}` | Self read/write (tight field allowlist) |
| `matchSummaries/{id}` | Read if `uid` in `playerUids`; **no client write** |
| `dailyRollups/{day}` | Auth read; **no client write** (Function/Admin) |
| `moderationEvents/{id}` | **Denied** until admin Custom Claims |

## Assumptions

1. SP / `#/admin` stats remain **localStorage** until Functions deploy — these rules are the future cloud contract.
2. Age gate stays client-side; `profiles.ageGateOk` is a mirror flag only.
3. Daily rollup + match summary **writes** are trusted (Admin SDK / Cloud Functions), matching RTDB `stats/daily`.
4. Ads stay off; no analytics collection rules here yet.
5. Validate with Firestore emulator before any prod rules deploy.
