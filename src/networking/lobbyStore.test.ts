import { describe, expect, it } from 'vitest';
import {
  LOBBY_PROTOCOL,
  isLobbyCode,
  newLobbyCode,
  planClose,
  planCreate,
  planJoin,
  type LobbyRecord,
} from './lobbyStore';

const open: LobbyRecord = {
  hostUid: 'host',
  createdAt: 1_700_000_000_000,
  status: 'open',
  protocol: LOBBY_PROTOCOL,
};

describe('newLobbyCode', () => {
  it('builds a six-symbol code from the unambiguous alphabet', () => {
    const code = newLobbyCode((bytes) => bytes.map((_, i) => i * 37));
    expect(code).toHaveLength(6);
    expect(isLobbyCode(code)).toBe(true);
  });

  it('maps the first and last alphabet symbols deterministically', () => {
    expect(newLobbyCode((bytes) => bytes.fill(0))).toBe('AAAAAA');
    expect(newLobbyCode((bytes) => bytes.fill(255))).toBe('999999');
  });

  it('draws from the platform random source by default', () => {
    expect(isLobbyCode(newLobbyCode())).toBe(true);
  });
});

describe('isLobbyCode', () => {
  it('accepts codes from the alphabet only', () => {
    expect(isLobbyCode('ABCD23')).toBe(true);
    expect(isLobbyCode('ABCDE9')).toBe(true);
  });

  it('rejects look-alike symbols, lowercase and the wrong length', () => {
    expect(isLobbyCode('ABCDI2')).toBe(false);
    expect(isLobbyCode('ABCDO2')).toBe(false);
    expect(isLobbyCode('ABCD10')).toBe(false);
    expect(isLobbyCode('abcd23')).toBe(false);
    expect(isLobbyCode('ABCDE')).toBe(false);
    expect(isLobbyCode('ABCDEFG')).toBe(false);
  });
});

describe('planCreate', () => {
  it('opens a lobby under a free code', () => {
    expect(planCreate(null, open)).toEqual(open);
  });

  it('refuses a code somebody already holds', () => {
    expect(planCreate(open, { ...open, hostUid: 'someone-else' })).toBeNull();
  });
});

describe('planJoin', () => {
  it('seats a friend in an open lobby and marks it full', () => {
    const plan = planJoin(open, 'guest');
    expect(plan).toEqual({ write: { ...open, guestUid: 'guest', status: 'full' } });
  });

  it('keeps the host and the creation time when a friend joins', () => {
    const plan = planJoin(open, 'guest');
    expect('write' in plan && plan.write.hostUid).toBe('host');
    expect('write' in plan && plan.write.createdAt).toBe(open.createdAt);
  });

  it('reports a missing lobby', () => {
    expect(planJoin(null, 'guest')).toEqual({ reject: 'missing' });
  });

  it('refuses a lobby from another protocol version', () => {
    expect(planJoin({ ...open, protocol: LOBBY_PROTOCOL + 1 }, 'guest')).toEqual({ reject: 'protocol' });
  });

  it('refuses a host joining their own lobby', () => {
    expect(planJoin(open, 'host')).toEqual({ reject: 'own' });
  });

  it('refuses a closed lobby', () => {
    expect(planJoin({ ...open, status: 'closed' }, 'guest')).toEqual({ reject: 'closed' });
  });

  it('refuses a third player: a full lobby or one that already has a guest', () => {
    expect(planJoin({ ...open, status: 'full', guestUid: 'first' }, 'third')).toEqual({ reject: 'full' });
    expect(planJoin({ ...open, guestUid: 'first' }, 'third')).toEqual({ reject: 'full' });
  });
});

describe('planClose', () => {
  it('lets the host close the lobby', () => {
    expect(planClose(open, 'host')).toEqual({ ...open, status: 'closed' });
  });

  it('does not let anyone else close it', () => {
    expect(planClose(open, 'guest')).toBeNull();
  });

  it('does nothing for a lobby that is already gone', () => {
    expect(planClose(null, 'host')).toBeNull();
  });
});
