import { describe, expect, it } from 'vitest';
import type { RealtimeLobbies } from './lobbyRealtime';
import {
  LOBBY_PROTOCOL,
  planClose,
  planCreate,
  planJoin,
  type LobbyRecord,
} from './lobbyStore';
import { createLobbySession } from './lobbySession';

/** An in-memory lobby board that applies the same decisions as the live store. */
function board() {
  const records = new Map<string, LobbyRecord>();
  const watchers = new Map<string, Set<(lobby: LobbyRecord | null) => void>>();
  const emit = (code: string): void => {
    const lobby = records.get(code) ?? null;
    for (const onChange of watchers.get(code) ?? []) onChange(lobby);
  };
  const service = {
    async create(code: string, hostUid: string, now = 0): Promise<boolean> {
      const next = planCreate(records.get(code) ?? null, {
        hostUid,
        createdAt: now,
        status: 'open',
        protocol: LOBBY_PROTOCOL,
      });
      if (!next) return false;
      records.set(code, next);
      emit(code);
      return true;
    },
    async join(code: string, guestUid: string) {
      const plan = planJoin(records.get(code) ?? null, guestUid);
      if ('reject' in plan) return { ok: false as const, reason: plan.reject };
      records.set(code, plan.write);
      emit(code);
      return { ok: true as const, lobby: plan.write };
    },
    async close(code: string, hostUid: string): Promise<boolean> {
      const next = planClose(records.get(code) ?? null, hostUid);
      if (!next) return false;
      records.set(code, next);
      emit(code);
      return true;
    },
    async read(code: string): Promise<LobbyRecord | null> {
      return records.get(code) ?? null;
    },
    watch(code: string, onChange: (lobby: LobbyRecord | null) => void): () => void {
      const set = watchers.get(code) ?? new Set();
      set.add(onChange);
      watchers.set(code, set);
      onChange(records.get(code) ?? null);
      return () => set.delete(onChange);
    },
  };
  return { records, service: service as unknown as RealtimeLobbies };
}

const sessionFor = (service: RealtimeLobbies | null, uid: string | null, code = 'ABCD23') =>
  createLobbySession({
    lobbies: service,
    signIn: async () => uid,
    makeCode: () => code,
    now: () => 1_700_000_000_000,
  });

describe('lobby session', () => {
  it('hosting a lobby shows its code and waits for a friend', async () => {
    const { service } = board();
    const host = sessionFor(service, 'host');
    await host.host();
    expect(host.peek()).toEqual({ status: 'hosting', code: 'ABCD23' });
  });

  it('the host sees the friend take the seat, and the friend sees the joined lobby', async () => {
    const { service } = board();
    const host = sessionFor(service, 'host');
    const friend = sessionFor(service, 'friend');
    await host.host();
    await friend.join('abcd23');
    expect(host.peek().status).toBe('hosted');
    expect(friend.peek()).toEqual({ status: 'joined', code: 'ABCD23' });
  });

  it('a third player is refused with the reason', async () => {
    const { service } = board();
    await sessionFor(service, 'host').host();
    await sessionFor(service, 'friend').join('ABCD23');
    const third = sessionFor(service, 'third');
    await third.join('ABCD23');
    expect(third.peek()).toEqual({ status: 'blocked', code: null, reason: 'lobby.reason.full' });
  });

  it('a friend joining an unknown code is told it is missing', async () => {
    const { service } = board();
    const friend = sessionFor(service, 'friend');
    await friend.join('ZZZZ23');
    expect(friend.peek().reason).toBe('lobby.reason.missing');
  });

  it('a host cannot join their own code', async () => {
    const { service } = board();
    const host = sessionFor(service, 'host');
    await host.host();
    await host.join('ABCD23');
    expect(host.peek().reason).toBe('lobby.reason.own');
  });

  it('short and malformed codes are refused before any network call', async () => {
    const { service } = board();
    const friend = sessionFor(service, 'friend');
    await friend.join('AB');
    expect(friend.peek().reason).toBe('lobby.codeShort');
    await friend.join('ABCDI2');
    expect(friend.peek().reason).toBe('lobby.reason.badCode');
  });

  it('closing the lobby tells the friend the host closed it', async () => {
    const { service, records } = board();
    const host = sessionFor(service, 'host');
    const friend = sessionFor(service, 'friend');
    await host.host();
    await friend.join('ABCD23');
    await host.leave();
    expect(host.peek()).toEqual({ status: 'idle', code: null });
    expect(records.get('ABCD23')?.status).toBe('closed');
    expect(friend.peek()).toEqual({ status: 'idle', code: null, reason: 'lobby.reason.closedByHost' });
  });

  it('a friend leaving does not close the host lobby', async () => {
    const { service, records } = board();
    const host = sessionFor(service, 'host');
    const friend = sessionFor(service, 'friend');
    await host.host();
    await friend.join('ABCD23');
    await friend.leave();
    expect(friend.peek()).toEqual({ status: 'idle', code: null });
    expect(records.get('ABCD23')?.status).toBe('full');
  });

  it('without a backend, hosting and joining say the service is offline', async () => {
    const host = sessionFor(null, 'host');
    await host.host();
    expect(host.peek().reason).toBe('lobby.reason.offline');
    const friend = sessionFor(null, 'friend');
    await friend.join('ABCD23');
    expect(friend.peek().reason).toBe('lobby.reason.offline');
  });

  it('a player who cannot sign in is told the service is offline', async () => {
    const { service } = board();
    const host = sessionFor(service, null);
    await host.host();
    expect(host.peek().reason).toBe('lobby.reason.offline');
  });

  it('gives up opening a code when every attempt is taken', async () => {
    const { service, records } = board();
    await sessionFor(service, 'someone').host();
    expect(records.has('ABCD23')).toBe(true);
    const host = sessionFor(service, 'host');
    await host.host();
    expect(host.peek()).toEqual({ status: 'blocked', code: null, reason: 'lobby.reason.codeTaken' });
  });

  it('tells subscribers when the state changes', async () => {
    const { service } = board();
    const host = sessionFor(service, 'host');
    let calls = 0;
    host.subscribe(() => {
      calls++;
    });
    await host.host();
    expect(calls).toBeGreaterThan(0);
  });
});
