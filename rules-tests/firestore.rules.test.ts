import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Runs against the Firestore emulator: `npm run test:rules` (needs Java 21).
// Expectations follow docs/firestore-security-rules.md; the rules file is a draft.

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kane-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

const signedOut = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

const NOW = 1_700_000_000_000;
const validUser = () => ({
  displayName: 'Alice',
  ageGateOk: true,
  createdAtMs: NOW,
  updatedAtMs: NOW,
  prefs: { species: 'brutes', difficulty: 'normal' } as Record<string, unknown>,
  cosmetics: { equipped: { brutes: 'default', nobles: 'default', weirdos: 'default' } },
});
const validMatch = () => ({
  endedAtMs: NOW,
  durationMs: 60_000,
  result: 'victory',
  won: true,
  species: 'brutes',
  difficulty: 'normal',
  playerUnitsLeft: 3,
  enemyUnitsLeft: 0,
  playerBuildingsLeft: 2,
  enemyBuildingsLeft: 0,
  mode: 'sp_ai',
});

describe('signed out', () => {
  it.each([
    'users/alice',
    'users/alice/matches/m1',
    'users/alice/statistics/overview',
    'profiles/alice',
    'matchSummaries/m1',
    'dailyRollups/2026-01-01',
    'moderationEvents/e1',
    'somethingElse/x',
  ])('cannot read or write %s', async (path) => {
    const doc = signedOut().doc(path);
    await assertFails(doc.get());
    await assertFails(doc.set({ any: 'thing' }));
  });

  it('cannot list a collection or a collection group', async () => {
    await assertFails(signedOut().collection('users').get());
    await assertFails(signedOut().collectionGroup('matches').get());
  });
});

describe('signed in as alice', () => {
  it('creates, reads and updates her own user document', async () => {
    const doc = as('alice').doc('users/alice');
    await assertSucceeds(doc.set(validUser()));
    await assertSucceeds(doc.get());
    await assertSucceeds(doc.update({ displayName: 'Alice B', updatedAtMs: NOW + 1 }));
  });

  it("cannot read or create bob's user document", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('users/bob').set(validUser());
    });
    await assertFails(as('alice').doc('users/bob').get());
    await assertFails(as('alice').doc('users/bob').set(validUser()));
  });

  it('cannot delete her own user document', async () => {
    await assertSucceeds(as('alice').doc('users/alice').set(validUser()));
    await assertFails(as('alice').doc('users/alice').delete());
  });

  type User = ReturnType<typeof validUser>;
  it.each<[string, (user: User) => object]>([
    ['an unknown species', (user) => ({ ...user, prefs: { ...user.prefs, species: 'dragons' } })],
    ['an unknown pref key', (user) => ({ ...user, prefs: { ...user.prefs, admin: true } })],
    ['an empty display name', (user) => ({ ...user, displayName: '' })],
    ['a display name over 32 characters', (user) => ({ ...user, displayName: 'x'.repeat(33) })],
    ['a missing required field', ({ createdAtMs: _omitted, ...rest }) => rest],
  ])('rejects %s', async (_label, change) => {
    await assertFails(as('alice').doc('users/alice').set(change(validUser())));
  });

  it('records a match once and cannot rewrite it', async () => {
    const match = as('alice').doc('users/alice/matches/m1');
    await assertSucceeds(match.set(validMatch()));
    await assertSucceeds(match.get());
    await assertFails(match.update({ won: false }));
    await assertFails(match.delete());
  });

  it('rejects a match whose won flag disagrees with the result', async () => {
    await assertFails(as('alice').doc('users/alice/matches/m1').set({ ...validMatch(), won: false }));
  });

  it("cannot read or write bob's matches", async () => {
    await assertFails(as('alice').doc('users/bob/matches/m1').get());
    await assertFails(as('alice').doc('users/bob/matches/m1').set(validMatch()));
  });

  it('writes statistics only as the overview document', async () => {
    const stats = { gamesStarted: 1, wins: 1, losses: 0, bySpecies: {}, updatedAtMs: NOW };
    await assertSucceeds(as('alice').doc('users/alice/statistics/overview').set(stats));
    await assertFails(as('alice').doc('users/alice/statistics/other').set(stats));
  });

  it('reads daily rollups but cannot write them', async () => {
    await assertSucceeds(as('alice').doc('dailyRollups/2026-01-01').get());
    await assertFails(as('alice').doc('dailyRollups/2026-01-01').set({ matches: 1 }));
  });

  it('reads a match summary only when listed as a player', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('matchSummaries/m1').set({ playerUids: ['alice', 'bob'] });
    });
    await assertSucceeds(as('alice').doc('matchSummaries/m1').get());
    await assertFails(as('carol').doc('matchSummaries/m1').get());
    await assertFails(as('alice').doc('matchSummaries/m1').set({ playerUids: ['alice'] }));
  });

  it('cannot touch moderation events or a path no rule names', async () => {
    await assertFails(as('alice').doc('moderationEvents/e1').get());
    await assertFails(as('alice').doc('moderationEvents/e1').set({ any: 'thing' }));
    await assertFails(as('alice').doc('somethingElse/x').get());
    await assertFails(as('alice').doc('somethingElse/x').set({ any: 'thing' }));
  });
});
