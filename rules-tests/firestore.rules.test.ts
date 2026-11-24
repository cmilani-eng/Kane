import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { applyPlacement, applyRaid, newProgress, sessionDoc } from '../src/games/sats-quest/satsSave';

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

// SATs Quest fixtures come from the client's own builders, so the rules and the client
// shape cannot drift apart without this file failing.
const satsProgress = () =>
  applyRaid(
    applyPlacement(newProgress(NOW), 'arithmetic', 0.37, [
      { key: 'k', code: '6C7a', correct: true, marks: 2, marksAvailable: 2, ms: 900 },
    ], NOW + 1),
    'arithmetic',
    3,
    2,
    7,
    [],
    NOW + 2,
  ) as unknown as Record<string, unknown>;
const satsSession = () =>
  sessionDoc('raid', 'arithmetic', 3, NOW, NOW + 60_000, [
    { key: 'k', code: '6C7a', correct: true, marks: 2, marksAvailable: 2, ms: 900 },
    { key: 'j', code: '6F4', correct: false, marks: 0, marksAvailable: 1, ms: 900 },
  ], 2, 'standard') as unknown as Record<string, unknown>;

describe('SATs Quest progress', () => {
  const progressPath = 'users/alice/sats/progress';

  it('lets alice create, read, update and delete her own progress', async () => {
    const doc = as('alice').doc(progressPath);
    await assertSucceeds(doc.set(newProgress(NOW) as unknown as Record<string, unknown>));
    await assertSucceeds(doc.set(satsProgress()));
    await assertSucceeds(doc.get());
    await assertSucceeds(doc.update({ xp: 500, updatedAtMs: NOW + 9 }));
    await assertSucceeds(doc.delete());
  });

  it("keeps bob's progress private and lets nobody signed out in", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('users/bob/sats/progress').set(satsProgress());
    });
    await assertFails(as('alice').doc('users/bob/sats/progress').get());
    await assertFails(as('alice').doc('users/bob/sats/progress').set(satsProgress()));
    await assertFails(as('alice').doc('users/bob/sats/progress').delete());
    await assertFails(signedOut().doc('users/bob/sats/progress').get());
    await assertFails(as('alice').collectionGroup('sats').get());
  });

  it('only accepts the single progress document', async () => {
    await assertFails(as('alice').doc('users/alice/sats/other').set(satsProgress()));
  });

  it.each<[string, (p: Record<string, unknown>) => Record<string, unknown>]>([
    ['an extra field such as a real name', (p) => ({ ...p, realName: 'Alice Smith' })],
    ['a missing field', ({ xp: _omitted, ...rest }) => rest],
    ['an unknown hero', (p) => ({ ...p, hero: 'pirate' })],
    ['negative XP', (p) => ({ ...p, xp: -1 })],
    ['an unknown timer mode', (p) => ({ ...p, settings: { timer: 'turbo', dyslexiaFont: false } })],
    ['a stored answer inside settings', (p) => ({ ...p, settings: { timer: 'off', dyslexiaFont: false, lastAnswer: '42' } })],
    ['an extra realm', (p) => ({ ...p, realms: { ...(p.realms as object), science: (p.realms as Record<string, unknown>).arithmetic } })],
    [
      'an unknown band',
      (p) => {
        const realms = p.realms as Record<string, Record<string, unknown>>;
        return { ...p, realms: { ...realms, grammar: { ...realms.grammar, band: 'genius' } } };
      },
    ],
    [
      'a chapter beyond 5',
      (p) => {
        const realms = p.realms as Record<string, Record<string, unknown>>;
        return { ...p, realms: { ...realms, reading: { ...realms.reading, unlocked: 6 } } };
      },
    ],
    [
      'too many content codes',
      (p) => ({ ...p, domainStats: Object.fromEntries(Array.from({ length: 81 }, (_, i) => [`C${i}`, { a: 1, c: 1 }])) }),
    ],
  ])('rejects progress with %s', async (_label, change) => {
    await assertFails(as('alice').doc(progressPath).set(change(satsProgress())));
  });
});

describe('SATs Quest sessions', () => {
  it('lets alice write a session summary once, read it and delete it, but not edit it', async () => {
    const doc = as('alice').doc('users/alice/satsSessions/s1');
    await assertSucceeds(doc.set(satsSession()));
    await assertSucceeds(doc.get());
    await assertSucceeds(as('alice').collection('users/alice/satsSessions').get());
    await assertFails(doc.update({ marks: 3 }));
    await assertSucceeds(doc.delete());
  });

  it("cannot read or write bob's sessions", async () => {
    await assertFails(as('alice').doc('users/bob/satsSessions/s1').set(satsSession()));
    await assertFails(as('alice').collection('users/bob/satsSessions').get());
  });

  it.each<[string, (s: Record<string, unknown>) => Record<string, unknown>]>([
    ['more correct answers than questions', (s) => ({ ...s, correct: 5, items: 2 })],
    ['more marks than were available', (s) => ({ ...s, marks: 9 })],
    ['an end before its start', (s) => ({ ...s, endedAtMs: NOW - 1 })],
    ['a stored answer', (s) => ({ ...s, answers: ['9,022'] })],
    ['an unknown kind', (s) => ({ ...s, kind: 'cheat' })],
  ])('rejects a session with %s', async (_label, change) => {
    await assertFails(as('alice').doc('users/alice/satsSessions/s1').set(change(satsSession())));
  });

  it('keeps the tutor cache and usage counters server-only', async () => {
    for (const path of ['satsLlmCache/abc', 'satsLlmUsage/alice_2026-11-24']) {
      await assertFails(as('alice').doc(path).get());
      await assertFails(as('alice').doc(path).set({ count: 0 }));
    }
  });
});
