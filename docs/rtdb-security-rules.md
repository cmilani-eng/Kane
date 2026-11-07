# RTDB security rules — draft assumptions

Source of truth: [`database.rules.json`](../database.rules.json) (wired from `firebase.json` → `database.rules`).

**Deny-by-default:** root `.read` / `.write` are `false`. Every path below must opt in.

Local Vite / SP vs AI **never** talks to RTDB today (lobby + stats are localStorage stubs). These rules are the contract for when emulator Auth + RTDB wire up.

## Paths

| Path | Intent |
|------|--------|
| `lobbies/$code` | Friend lobby create/join stub shape (`hostUid`, `guestUid`, `status`, `createdAt`) |
| `matches/$matchId` | Command log + desync hashes + tick meta for lockstep spike |
| `stats/summaries/$id` | Per-match summary write by owner (mirrors local `#/admin` payloads) |
| `stats/daily/$day` | Daily rollup — **client read OK, client write denied** (Function/Admin SDK later) |
| `moderation/events/$id` | Admin moderation log — **client write denied** |
| `profiles/$uid` | Own profile only (display name, age-gate flag) |

## Assumptions

1. **Firebase Auth** is required for any non-denied path (`auth != null`). Anonymous Auth is enough for lobby spikes.
2. **Age positioning (13+)** is a product/legal framing concern, not an in-game gate. RTDB cannot prove age; `profiles.ageGateOk` remains a mirror flag only.
3. **Lobby codes** are `A–Z0–9`, length 4–8 (matches local stub generator).
4. **Command writes** are per-uid under `matches/$id/commands/$tick/$uid` — players cannot forge another uid’s commands.
5. **Desync hashes** follow the same per-uid write rule under `hashes/$tick/$uid`.
6. **Daily rollups** are produced by a trusted writer (Cloud Function / Admin SDK). Rules keep `.write: false` on `stats/daily` for clients so `#/admin` rollup stubs stay local until Functions deploy.
7. **Moderation** events are Admin-SDK-only writes; clients may read their own authored events later if needed.
8. **Ads** remain off (`adsEnabled=false`) — unrelated to RTDB, listed so soft-launch posture stays consistent.
9. **Emulator testing:** `firebase emulators:start` + the rules unit tests (`npm run test:rules`) before any prod deploy.

## Out of scope (this draft)

- Firestore rules (see `firestore.rules`)
- Live MP sync / presence
- Admin allowlist enforcement inside RTDB (allowlist is still local stub / future Custom Claims)

## How to validate

`npm run test:rules` runs [`rules-tests/database.rules.test.ts`](../rules-tests/database.rules.test.ts) against the Database emulator (needs Java 21; CI runs it on every pull request). What is actually deployed to the project is checked by hand: see [security-verification.md](./security-verification.md).

To exercise the rules from the app instead:

```bash
# With firebase-tools + emulators
firebase emulators:start --only database,auth
# Then exercise lobby create/join + command append against Auth users.
```
