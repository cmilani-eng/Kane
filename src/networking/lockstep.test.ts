import { describe, expect, it } from 'vitest';
import type { BattleCommand } from '../gameplay/battlefield/battlefieldCommands';
import { createLockstep, LOCKSTEP_DELAY_TICKS, type LockstepTransport } from './lockstep';

type OrderListener = (tick: number, commands: BattleCommand[]) => void;
type HashListener = (tick: number, hash: string) => void;

/**
 * Two players linked by a message queue. Messages wait in the queue until `deliver`
 * is called, so a test can choose when each one arrives.
 */
function duo() {
  const queue: Array<() => void> = [];
  const orderListeners: Record<'a' | 'b', Set<OrderListener>> = { a: new Set(), b: new Set() };
  const hashListeners: Record<'a' | 'b', Set<HashListener>> = { a: new Set(), b: new Set() };

  const transport = (me: 'a' | 'b'): LockstepTransport => {
    const other = me === 'a' ? 'b' : 'a';
    return {
      sendOrders(tick, commands) {
        const copy = commands.map((c) => ({ ...c, unitIds: [...c.unitIds] }));
        queue.push(() => orderListeners[other].forEach((l) => l(tick, copy)));
      },
      onPeerOrders(listener) {
        orderListeners[me].add(listener);
        return () => orderListeners[me].delete(listener);
      },
      sendHash(tick, hash) {
        queue.push(() => hashListeners[other].forEach((l) => l(tick, hash)));
      },
      onPeerHash(listener) {
        hashListeners[me].add(listener);
        return () => hashListeners[me].delete(listener);
      },
    };
  };

  return {
    a: createLockstep(transport('a')),
    b: createLockstep(transport('b')),
    deliver(): void {
      while (queue.length > 0) queue.shift()!();
    },
  };
}

const move = (team: 'player' | 'enemy', x: number): BattleCommand => ({
  kind: 'move',
  team,
  unitIds: [1, 2],
  x,
  y: 100,
});

type Side = ReturnType<typeof createLockstep>;

/** Runs one side as far as it can: each tick needs the other side's orders for it. */
function advance(side: Side, from: number, applied: Map<number, BattleCommand[]>): number {
  let tick = from;
  while (side.canRun(tick)) {
    applied.set(tick, side.beginTick(tick));
    tick++;
  }
  return tick;
}

describe('lockstep', () => {
  it('runs the first ticks without waiting, since no order can be due before the delay', () => {
    const { a } = duo();
    for (let tick = 0; tick < LOCKSTEP_DELAY_TICKS; tick++) {
      expect(a.canRun(tick)).toBe(true);
    }
  });

  it('a side waits for the other side before it runs a tick that needs its orders', () => {
    const d = duo();
    const aApplied = new Map<number, BattleCommand[]>();
    const reached = advance(d.a, 0, aApplied);
    expect(reached).toBe(LOCKSTEP_DELAY_TICKS);
    expect(d.a.canRun(LOCKSTEP_DELAY_TICKS)).toBe(false);
  });

  it('an order given now takes effect on the same tick on both sides', () => {
    const d = duo();
    const aApplied = new Map<number, BattleCommand[]>();
    const bApplied = new Map<number, BattleCommand[]>();
    d.a.issue(0, move('player', 300));
    d.b.issue(0, move('enemy', 500));
    let aTick = 0;
    let bTick = 0;
    for (let round = 0; round < 40; round++) {
      d.deliver();
      aTick = advance(d.a, aTick, aApplied);
      bTick = advance(d.b, bTick, bApplied);
    }
    const onA = aApplied.get(LOCKSTEP_DELAY_TICKS) ?? [];
    expect(onA).toHaveLength(2);
    expect(onA).toEqual(bApplied.get(LOCKSTEP_DELAY_TICKS));
    for (let tick = 0; tick < LOCKSTEP_DELAY_TICKS; tick++) {
      expect(aApplied.get(tick)).toEqual([]);
    }
  });

  it('the same orders apply on the same ticks on both sides, however the messages are delayed', () => {
    const d = duo();
    const aApplied = new Map<number, BattleCommand[]>();
    const bApplied = new Map<number, BattleCommand[]>();
    d.a.issue(0, move('player', 300));
    d.a.issue(4, move('player', 350));
    d.b.issue(2, move('enemy', 500));
    let aTick = 0;
    let bTick = 0;
    // Deliver only every third round, so the two sides see the traffic in different rhythms.
    for (let round = 0; round < 200; round++) {
      if (round % 3 === 0) d.deliver();
      aTick = advance(d.a, aTick, aApplied);
      bTick = advance(d.b, bTick, bApplied);
    }
    d.deliver();
    aTick = advance(d.a, aTick, aApplied);
    bTick = advance(d.b, bTick, bApplied);
    const ticks = Math.min(aTick, bTick);
    expect(ticks).toBeGreaterThan(LOCKSTEP_DELAY_TICKS + 4);
    for (let tick = 0; tick < ticks; tick++) {
      expect(aApplied.get(tick)).toEqual(bApplied.get(tick));
    }
  });

  it('a side that has not heard from its peer stops, and resumes once the orders arrive', () => {
    const d = duo();
    const aApplied = new Map<number, BattleCommand[]>();
    let aTick = advance(d.a, 0, aApplied);
    expect(d.a.canRun(aTick)).toBe(false);
    const bApplied = new Map<number, BattleCommand[]>();
    const bTick = advance(d.b, 0, bApplied);
    d.deliver();
    aTick = advance(d.a, aTick, aApplied);
    expect(aTick).toBeGreaterThan(LOCKSTEP_DELAY_TICKS);
    expect(bTick).toBe(LOCKSTEP_DELAY_TICKS);
  });

  it('reports the first tick where the two state hashes differ, and only once both are known', () => {
    const d = duo();
    d.a.recordHash(30, 'aaaa');
    d.b.recordHash(30, 'aaaa');
    d.a.recordHash(60, 'bbbb');
    d.b.recordHash(60, 'cccc');
    expect(d.a.desyncTick()).toBeNull();
    d.deliver();
    expect(d.a.desyncTick()).toBe(60);
    expect(d.b.desyncTick()).toBe(60);
    expect(d.a.desyncTick()).toBeNull();
  });

  it('keeps a hash that the other side has not sent yet until it arrives', () => {
    const d = duo();
    d.a.recordHash(30, 'aaaa');
    expect(d.a.desyncTick()).toBeNull();
    d.b.recordHash(30, 'zzzz');
    d.deliver();
    expect(d.a.desyncTick()).toBe(30);
  });
});
