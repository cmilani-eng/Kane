import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Runs against the Realtime Database emulator: `npm run test:rules` (needs Java 21).
// Expectations follow docs/rtdb-security-rules.md.

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kane-rules',
    database: { rules: readFileSync('database.rules.json', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearDatabase();
});

const signedOut = () => env.unauthenticatedContext().database();
const as = (uid: string) => env.authenticatedContext(uid).database();
const read = (db: ReturnType<typeof signedOut>, path: string) => db.ref(path).once('value');

/** Rules compare `createdAt` and `updatedAt` with the server clock, so stay in the past. */
const past = () => Date.now() - 60_000;

describe('signed out', () => {
  it.each([
    '/',
    'lobbies/ABCD',
    'matches/m1',
    'stats/daily/2026-01-01',
    'stats/summaries/s1',
    'profiles/alice',
    'moderation/events/e1',
  ])('cannot read or write %s', async (path) => {
    await assertFails(read(signedOut(), path));
    await assertFails(signedOut().ref(path).set({ any: 'thing' }));
  });
});

describe('signed in as alice', () => {
  it('cannot read the root', async () => {
    await assertFails(read(as('alice'), '/'));
  });

  describe('profiles', () => {
    it('writes and reads her own profile', async () => {
      const profile = as('alice').ref('profiles/alice');
      await assertSucceeds(profile.set({ displayName: 'Alice', ageGateOk: true, updatedAt: past() }));
      await assertSucceeds(profile.once('value'));
    });

    it("cannot read or write bob's profile", async () => {
      await assertFails(read(as('alice'), 'profiles/bob'));
      await assertFails(as('alice').ref('profiles/bob').set({ updatedAt: past() }));
    });

    it.each([
      ['no updatedAt', { displayName: 'Alice' }],
      ['an empty display name', { displayName: '', updatedAt: 1 }],
      ['a display name over 32 characters', { displayName: 'x'.repeat(33), updatedAt: 1 }],
      ['a non-boolean age flag', { ageGateOk: 'yes', updatedAt: 1 }],
    ])('rejects %s', async (_label, profile) => {
      await assertFails(as('alice').ref('profiles/alice').set(profile));
    });
  });

  describe('server-written paths', () => {
    it('reads daily stats but cannot write them', async () => {
      await assertSucceeds(read(as('alice'), 'stats/daily/2026-01-01'));
      await assertFails(as('alice').ref('stats/daily/2026-01-01').set({ matches: 1 }));
    });

    it('cannot write moderation events', async () => {
      await assertFails(as('alice').ref('moderation/events/e1').set({ byAdminUid: 'alice' }));
    });
  });

  describe('stats summaries', () => {
    const summary = (ownerUid: string) => ({
      ownerUid,
      endedAtMs: past(),
      result: 'victory',
      species: 'brutes',
      won: true,
    });

    it('writes her own summary once and reads it back', async () => {
      const ref = as('alice').ref('stats/summaries/s1');
      await assertSucceeds(ref.set(summary('alice')));
      await assertSucceeds(ref.once('value'));
      await assertFails(ref.set(summary('alice')));
    });

    it("cannot write a summary in bob's name or read one that is not hers", async () => {
      await assertFails(as('alice').ref('stats/summaries/s2').set(summary('bob')));
      await assertSucceeds(as('alice').ref('stats/summaries/s1').set(summary('alice')));
      await assertFails(read(as('bob'), 'stats/summaries/s1'));
    });
  });

  describe('lobbies', () => {
    const lobby = () => ({ hostUid: 'alice', createdAt: past(), status: 'open' });

    it('opens a lobby and reads it as the host', async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertSucceeds(read(as('alice'), 'lobbies/ABCD'));
    });

    it.each(['abcd', 'AB', 'ABCDEFGHI'])('rejects the code %s', async (code) => {
      await assertFails(as('alice').ref(`lobbies/${code}`).set(lobby()));
    });

    it('stops another player reading or overwriting her lobby', async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertFails(read(as('bob'), 'lobbies/ABCD'));
      await assertFails(as('bob').ref('lobbies/ABCD').set({ ...lobby(), hostUid: 'bob' }));
    });
  });

  describe('matches', () => {
    beforeEach(async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx.database().ref('matches/m1').set({
          hostUid: 'alice',
          lobbyCode: 'ABCD',
          createdAt: 1,
          players: { alice: { joinedAt: 1 } },
        });
      });
    });

    it('lets a listed player read the match and nobody else', async () => {
      await assertSucceeds(read(as('alice'), 'matches/m1'));
      await assertFails(read(as('bob'), 'matches/m1'));
    });

    it("cannot write a command in another player's name", async () => {
      const command = { kind: 'move', payload: '{}', seq: 0 };
      await assertFails(as('alice').ref('matches/m1/commands/1/bob').set(command));
    });

    it('cannot write a command when not in the match', async () => {
      const command = { kind: 'move', payload: '{}', seq: 0 };
      await assertFails(as('carol').ref('matches/m1/commands/1/carol').set(command));
    });
  });
});
