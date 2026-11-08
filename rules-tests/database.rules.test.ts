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

    it('lets a friend see an open lobby by its code and join it', async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertSucceeds(read(as('bob'), 'lobbies/ABCD'));
      await assertSucceeds(
        as('bob').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'bob', status: 'full' }),
      );
    });

    it('does not let a stranger take the host seat, close the lobby, or add a second guest', async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertFails(as('bob').ref('lobbies/ABCD').set({ ...lobby(), hostUid: 'bob' }));
      await assertFails(as('bob').ref('lobbies/ABCD').set({ ...lobby(), status: 'closed' }));
      await assertSucceeds(
        as('bob').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'bob', status: 'full' }),
      );
      await assertFails(
        as('carol').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'carol', status: 'full' }),
      );
    });

    it('does not let a friend seat somebody else as the guest', async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertFails(
        as('bob').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'carol', status: 'full' }),
      );
    });

    it('lets only the host close the lobby', async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set({ ...lobby(), status: 'closed' }));
    });

    it('lets the host close a lobby that already has a guest, keeping the guest seat', async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertSucceeds(
        as('bob').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'bob', status: 'full' }),
      );
      await assertSucceeds(
        as('alice').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'bob', status: 'closed' }),
      );
    });

    it('does not let the host replace the guest seat with someone else', async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertSucceeds(
        as('bob').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'bob', status: 'full' }),
      );
      await assertFails(
        as('alice').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'carol', status: 'closed' }),
      );
    });

    it('does not show a lobby that is full or closed to strangers', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx.database().ref('lobbies/WXYZ').set({
          ...lobby(),
          guestUid: 'bob',
          status: 'full',
        });
      });
      await assertFails(read(as('carol'), 'lobbies/WXYZ'));
    });
  });

  describe('matches', () => {
    const lobby = () => ({ hostUid: 'alice', createdAt: past(), status: 'open' });
    const setup = () => ({ seed: 7, mapId: 'crossing', difficulty: 'normal', hostSpecies: 'brutes', startedAt: past() });

    /** A full lobby: alice hosts, bob is seated. The match node is keyed by the lobby code. */
    beforeEach(async () => {
      await assertSucceeds(as('alice').ref('lobbies/ABCD').set(lobby()));
      await assertSucceeds(as('bob').ref('lobbies/ABCD').set({ ...lobby(), guestUid: 'bob', status: 'full' }));
    });

    it('the host writes the match setup and both players can read it', async () => {
      await assertSucceeds(as('alice').ref('matches/ABCD/setup').set(setup()));
      await assertSucceeds(read(as('alice'), 'matches/ABCD/setup'));
      await assertSucceeds(read(as('bob'), 'matches/ABCD/setup'));
    });

    it('the guest cannot write the match setup', async () => {
      await assertFails(as('bob').ref('matches/ABCD/setup').set(setup()));
    });

    it('rejects a setup with missing fields', async () => {
      const { seed: _seed, ...partial } = setup();
      await assertFails(as('alice').ref('matches/ABCD/setup').set({ ...partial, seed: undefined }));
    });

    it('a stranger cannot read the match', async () => {
      await assertSucceeds(as('alice').ref('matches/ABCD/setup').set(setup()));
      await assertFails(read(as('carol'), 'matches/ABCD'));
    });

    it('the guest records their own species, and only theirs', async () => {
      await assertSucceeds(as('bob').ref('matches/ABCD/guestSpecies').set('nobles'));
      await assertFails(as('alice').ref('matches/ABCD/guestSpecies').set('weirdos'));
    });

    it('each player writes only their own orders for a tick', async () => {
      await assertSucceeds(as('alice').ref('matches/ABCD/cmd/alice/12').set('[]'));
      await assertSucceeds(as('bob').ref('matches/ABCD/cmd/bob/12').set('[]'));
      await assertFails(as('alice').ref('matches/ABCD/cmd/bob/12').set('[]'));
      await assertFails(as('bob').ref('matches/ABCD/cmd/alice/12').set('[]'));
    });

    it('a stranger cannot write orders into the match', async () => {
      await assertFails(as('carol').ref('matches/ABCD/cmd/carol/1').set('[]'));
    });

    it('orders are keyed by a whole-number tick and must be text', async () => {
      await assertFails(as('alice').ref('matches/ABCD/cmd/alice/twelve').set('[]'));
      await assertFails(as('alice').ref('matches/ABCD/cmd/alice/12').set({ c: '[]' }));
    });

    it('each player records their own state hash, and only theirs', async () => {
      await assertSucceeds(as('alice').ref('matches/ABCD/hash/alice/30').set('a1b2c3d4'));
      await assertFails(as('bob').ref('matches/ABCD/hash/alice/30').set('ffffffff'));
    });
  });
});
