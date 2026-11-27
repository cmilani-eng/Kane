import { describe, expect, it } from 'vitest';
import {
  BOSS_THROW,
  CEILING_TYPES,
  CEILING_Y,
  GAP_HARD_SCORE,
  GROUND,
  HAZARD_TYPES,
  HOP_LENGTH,
  PATTERNS,
  SKATER_X,
  SWOOP,
  UNDER,
  VIEW_W,
  WORLDS,
  collide,
  createRun,
  hazardBox,
  isCeiling,
  jump,
  liftOf,
  spawnCoins,
  spawnGap,
  spawnItem,
  spawnPattern,
  stepRun,
  type BoardId,
  type Item,
  type Run,
} from './skateRules';
import { LEVELS } from './skateLevels';

/** Every test here plays the default level, Easy. */
const EASY = LEVELS.easy;
const { rushers: RUSHERS, gapEasy: GAP_EASY, gapHard: GAP_HARD } = EASY;

/** Deterministic random source. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const half = (): number => 0.5;
/** Random source cycling through the given values. */
function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

/** A run on which nothing spawns by itself, so a test controls every item. */
function quietRun(board: BoardId = 'basic'): Run {
  const run = createRun(board);
  run.spawn = 1e9;
  return run;
}
function item(partial: Partial<Item> & Pick<Item, 'type' | 'x'>): Item {
  return { y: 0, w: 50, h: 0, phase: 0, ...partial };
}
function steps(run: Run, count: number): void {
  for (let i = 0; i < count; i++) stepRun(run, half);
}

describe('a fresh run', () => {
  it('starts on the ground with the deck-dependent speed', () => {
    expect(createRun('basic').speed).toBe(6);
    expect(createRun('speed').speed).toBeCloseTo(6.7);
    expect(createRun('basic').player.y).toBe(GROUND - 58);
  });

  it('rests on the ground without drifting', () => {
    const run = quietRun();
    steps(run, 30);
    expect(run.player.y).toBe(GROUND - run.player.h);
    expect(run.player.vy).toBe(0);
    expect(run.player.jumps).toBe(0);
  });
});

describe('jumping', () => {
  it('gives a jump and one more in the air, and no further', () => {
    const run = quietRun();
    expect(jump(run, half)).toBe(true);
    expect(run.player.vy).toBe(-13.2);
    expect(jump(run, half)).toBe(true);
    expect(run.player.vy).toBe(-16.5);
    expect(jump(run, half)).toBe(false);
    expect(run.player.vy).toBe(-16.5);
    expect(run.player.jumps).toBe(2);
  });

  it('stays refused all the way down, until the skater lands', () => {
    const run = quietRun();
    jump(run, half);
    steps(run, 10);
    jump(run, half);
    while (run.player.y < GROUND - run.player.h) {
      expect(jump(run, half)).toBe(false);
      steps(run, 1);
    }
    expect(jump(run, half)).toBe(true);
  });

  it('flips and bursts forward on the second jump', () => {
    const run = quietRun();
    jump(run, half);
    expect(run.flip).toBe(0);
    jump(run, half);
    expect(run.flip).toBe(1);
    expect(run.turbo).toBeGreaterThanOrEqual(100);
    expect(run.player.boost).toBe(100);
  });

  it('lifts higher off the Air Deck', () => {
    const run = quietRun('jump');
    jump(run, half);
    expect(run.player.vy).toBe(-16);
  });

  it('lands, and gets its jumps back', () => {
    const run = quietRun();
    jump(run, half);
    jump(run, half);
    steps(run, 200);
    expect(run.player.y).toBe(GROUND - run.player.h);
    expect(run.player.jumps).toBe(0);
  });

  it('does nothing once the run is over', () => {
    const run = quietRun();
    run.over = true;
    expect(jump(run, half)).toBe(false);
  });
});

describe('speed and worlds', () => {
  it('speeds up with distance, then caps at 12.5', () => {
    const run = quietRun();
    steps(run, 1900);
    expect(run.speed).toBeCloseTo(7, 5);
    run.frame = 100000;
    steps(run, 1);
    expect(run.speed).toBe(12.5);
  });

  it('adds Turbo and the Speed Deck on top', () => {
    const turbo = quietRun();
    turbo.turbo = 10;
    steps(turbo, 1);
    expect(turbo.speed).toBeCloseTo(8, 2);
    const deck = quietRun('speed');
    steps(deck, 1);
    expect(deck.speed).toBeCloseTo(6.5, 2);
  });

  it('moves to the next world every 180 points and loops after the last', () => {
    const run = quietRun();
    expect(run.worldIndex).toBe(0);
    run.score = 179.9;
    steps(run, 1);
    expect(run.worldIndex).toBe(1);
    run.score = WORLDS.length * 180 - 0.1;
    steps(run, 1);
    expect(run.worldIndex).toBe(0);
  });
});

describe('spawning', () => {
  it('first spawns after 60 steps: one hazard and a coin arc', () => {
    const run = createRun('basic');
    steps(run, 60);
    expect(run.items.filter((o) => o.type === 'bird')).toHaveLength(1);
    expect(run.items.filter((o) => o.type === 'coin')).toHaveLength(5);
    expect(run.spawn).toBeGreaterThanOrEqual(GAP_EASY[0] - 1);
  });

  it('"double" is spikes followed by a bird', () => {
    const run = quietRun();
    spawnItem(run, seq((PATTERNS.indexOf('double') + 0.5) / PATTERNS.length, 0.5, 0.5));
    expect(run.items.map((o) => o.type)).toEqual(['spikes', 'bird']);
    expect(run.items[0].w).toBe(58);
  });

  it('only makes sensible hazards, whatever the dice say', () => {
    const random = seeded(7);
    for (let i = 0; i < 500; i++) {
      const run = quietRun();
      spawnItem(run, random);
      for (const o of run.items) {
        expect(HAZARD_TYPES).toContain(o.type);
        expect(o.x).toBeGreaterThanOrEqual(VIEW_W + 20);
        expect(o.w).toBeGreaterThan(0);
        if (o.type === 'pit') expect(o.w).toBeGreaterThanOrEqual(110);
        if (o.type === 'pit') expect(o.w).toBeLessThanOrEqual(165);
        if (o.type === 'spikes') expect(o.w).toBeLessThanOrEqual(78);
        if (o.type === 'animal') expect(o.y).toBe(GROUND - 30);
      }
    }
  });

  it('lays five coins in an arc, highest in the middle', () => {
    const run = quietRun();
    spawnCoins(run, 1000);
    expect(run.items).toHaveLength(5);
    expect(run.items[1].x - run.items[0].x).toBe(32);
    expect(Math.min(...run.items.map((o) => o.y))).toBe(run.items[2].y);
  });
});

describe('low ceilings', () => {
  const BOARDS: BoardId[] = ['basic', 'speed', 'jump', 'magnet'];

  /** Highest the hitbox gets in one airtime, with the second jump (if any) after `secondAt` steps. */
  function highestHitbox(board: BoardId, secondAt: number | null): { top: number; airtime: number } {
    const run = quietRun(board);
    jump(run, half);
    let top = Infinity;
    let airtime = 0;
    do {
      if (airtime === secondAt) expect(jump(run, half)).toBe(true);
      steps(run, 1);
      airtime++;
      top = Math.min(top, run.player.y + 8);
    } while (run.player.y < GROUND - run.player.h);
    return { top, airtime };
  }

  it.each(BOARDS)('hang above everything a single jump reaches on the %s deck', (board) => {
    expect(highestHitbox(board, null).top).toBeGreaterThan(CEILING_Y + 8);
  });

  it.each(BOARDS)('are hit by a second jump taken at any moment on the %s deck', (board) => {
    const { airtime } = highestHitbox(board, null);
    for (let at = 0; at < airtime; at++) {
      expect(highestHitbox(board, at).top, `second jump after ${at} steps`).toBeLessThan(CEILING_Y);
    }
  });

  it('cannot be flown over, however high the skater is', () => {
    for (const type of CEILING_TYPES) {
      const run = quietRun();
      run.player.y = -300;
      run.player.vy = -1;
      run.items.push(item({ type, x: 100, w: 400 }));
      expect(stepRun(run, half), type).toContain('wipeout');
    }
  });

  it('let a skater on the ground pass underneath', () => {
    for (const type of CEILING_TYPES) {
      const run = quietRun();
      run.items.push(item({ type, x: 150, w: 400 }));
      steps(run, 90);
      expect(run.over, type).toBe(false);
    }
  });

  it.each(Object.keys(UNDER) as (keyof typeof UNDER)[])('%s hangs a ceiling over a ground hazard', (pattern) => {
    const run = quietRun();
    spawnPattern(run, pattern, half);
    const [ceiling, ground] = run.items;
    expect(ceiling.type).toBe(UNDER[pattern].ceiling);
    expect(ground.type).toBe(UNDER[pattern].ground);
    expect(isCeiling(ceiling.type)).toBe(true);
    // The ceiling reaches well before the hazard under it, and well after.
    expect(ground.x - ceiling.x).toBeGreaterThanOrEqual(100);
    expect(ceiling.x + ceiling.w - (ground.x + ground.w)).toBeGreaterThanOrEqual(190);
  });

  it('are longer when the world is faster', () => {
    const slow = quietRun();
    spawnPattern(slow, 'under-bridge', half);
    const fast = quietRun();
    fast.frame = 100000;
    spawnPattern(fast, 'under-bridge', half);
    expect(fast.items[0].w).toBeGreaterThan(slow.items[0].w);
  });

  it('are destroyed by a Shield like any other hazard', () => {
    const run = quietRun();
    run.shield = true;
    run.player.y = 60;
    run.player.vy = -5;
    run.items.push(item({ type: 'bridge', x: 100, w: 400 }));
    expect(stepRun(run, half)).toEqual(['shield-hit']);
    expect(run.items).toHaveLength(0);
  });
});

describe('enemies', () => {
  /** Step until the item is no longer ahead of the skater, with a Shield so nothing ends the run. */
  function stepsToArrive(run: Run, o: Item): number {
    let count = 0;
    while (o.x > SKATER_X + 45) {
      run.shield = true;
      steps(run, 1);
      count++;
    }
    return count;
  }

  it.each(['roller', 'chaser', 'monster'] as const)('%s outruns the scroll once it is close enough', (type) => {
    const run = quietRun();
    spawnPattern(run, type, half);
    const [o] = run.items;
    expect(o.trigger).toBe(RUSHERS[type].trigger);
    o.x = SKATER_X + RUSHERS[type].trigger + 50;
    let before = o.x;
    steps(run, 1);
    expect(before - o.x).toBeCloseTo(run.speed);
    o.x = SKATER_X + RUSHERS[type].trigger - 5;
    before = o.x;
    steps(run, 1);
    // `bonus` pixels a step faster than the scroll it spawned into.
    expect(before - o.x).toBeCloseTo(run.speed + RUSHERS[type].bonus, 1);
  });

  it.each(['roller', 'chaser', 'monster'] as const)('%s still arrives when a plain hazard would', (type) => {
    for (const frame of [0, 100000]) {
      const rushing = quietRun();
      rushing.frame = frame;
      spawnPattern(rushing, type, half);
      const plain = quietRun();
      plain.frame = frame;
      spawnPattern(plain, 'crate', half);
      const gap = stepsToArrive(rushing, rushing.items[0]) - stepsToArrive(plain, plain.items[0]);
      expect(Math.abs(gap), `frame ${frame}`).toBeLessThanOrEqual(2);
    }
  });

  it.each(['animal', 'robot'] as const)('%s hops, and its hitbox goes with it', (type) => {
    const lifts: number[] = [];
    const tops: number[] = [];
    for (let x = 0; x < HOP_LENGTH[type]; x += 5) {
      const o = item({ type, x });
      lifts.push(liftOf(o));
      tops.push(hazardBox(o, 0).y + liftOf(o));
    }
    expect(Math.max(...lifts)).toBeCloseTo(EASY.hops[type], 0);
    expect(Math.min(...lifts)).toBeLessThan(4);
    for (const top of tops) expect(top).toBeCloseTo(tops[0]);
  });

  it('a monster leaps as its rush starts and is back down before it arrives', () => {
    const run = quietRun();
    spawnPattern(run, 'monster', half);
    const [o] = run.items;
    const at = (ahead: number): number => liftOf({ ...o, x: SKATER_X + ahead });
    expect(at(RUSHERS.monster.trigger + 10)).toBe(0);
    expect(at(RUSHERS.monster.trigger - 110)).toBeGreaterThan(40);
    expect(at(150)).toBe(0);
    expect(at(40)).toBe(0);
  });

  it.each(['bird', 'drone', 'alien'] as const)('%s dives at a skater on the ground', (type) => {
    const run = quietRun();
    run.items.push(item({ type, x: SKATER_X + EASY.swoop.trigger + 60, y: 170 }));
    const [o] = run.items;
    steps(run, 5);
    expect(o.target).toBeUndefined();
    expect(Math.abs(o.y - 170)).toBeLessThanOrEqual(SWOOP.bob);
    run.shield = true;
    while (o.x > SKATER_X + EASY.swoop.end) steps(run, 1);
    expect(o.target).toBe(GROUND - 29);
    expect(o.y).toBeCloseTo(GROUND - 29);
  });

  it('a flyer aims high at a skater who jumped early, and never re-aims', () => {
    const run = quietRun();
    run.player.y = 120;
    run.player.vy = 0;
    run.items.push(item({ type: 'bird', x: SKATER_X + EASY.swoop.trigger, y: 170 }));
    steps(run, 1);
    expect(run.items[0].target).toBe(SWOOP.minY);
    steps(run, 40);
    expect(run.player.y).toBe(GROUND - run.player.h);
    expect(run.items[0].target).toBe(SWOOP.minY);
  });

  it('a flyer that aimed high goes over a skater who stays down', () => {
    const run = quietRun();
    run.items.push(item({ type: 'bird', x: SKATER_X + 200, y: SWOOP.minY, target: SWOOP.minY, diveFrom: SWOOP.minY }));
    steps(run, 80);
    expect(run.over).toBe(false);
  });

  it('the boss throws exactly one bomb, which gets there first', () => {
    const run = quietRun();
    spawnPattern(run, 'boss', half);
    const [boss] = run.items;
    while (boss.x > SKATER_X + EASY.throwAt[0]) steps(run, 1);
    steps(run, 10);
    const bombs = run.items.filter((o) => o.type === 'bomb');
    expect(bombs).toHaveLength(1);
    expect(bombs[0].x).toBeLessThan(boss.x - 20);
    const gapNow = boss.x - bombs[0].x;
    steps(run, 20);
    expect(boss.x - bombs[0].x).toBeGreaterThan(gapNow);
    expect(run.items.filter((o) => o.type === 'bomb')).toHaveLength(1);
  });

  it('a bomb is lobbed, then rolls along the ground', () => {
    const bomb = item({ type: 'bomb', x: SKATER_X + 600, thrownAt: 600 });
    expect(liftOf(bomb)).toBe(BOSS_THROW.lift);
    expect(liftOf({ ...bomb, x: SKATER_X + 600 - BOSS_THROW.fall })).toBe(0);
    expect(liftOf({ ...bomb, x: SKATER_X + 40 })).toBe(0);
  });
});

describe('spawn pacing', () => {
  it('tightens the gaps as the score rises, then holds', () => {
    expect(spawnGap(0, () => 0)).toBe(GAP_EASY[0]);
    expect(spawnGap(0, () => 1)).toBe(GAP_EASY[1]);
    expect(spawnGap(GAP_HARD_SCORE / 2, () => 0)).toBe((GAP_EASY[0] + GAP_HARD[0]) / 2);
    expect(spawnGap(GAP_HARD_SCORE, () => 0)).toBe(GAP_HARD[0]);
    expect(spawnGap(GAP_HARD_SCORE * 9, () => 1)).toBe(GAP_HARD[1]);
  });

  it('leaves enough time to land from the longest single jump before the next hazard', () => {
    const run = quietRun('jump');
    jump(run, half);
    let airtime = 0;
    do {
      steps(run, 1);
      airtime++;
    } while (run.player.y < GROUND - run.player.h);
    expect(GAP_HARD[0]).toBeGreaterThanOrEqual(airtime + 12);
  });

  it('waits longer after a long pattern than after a short one', () => {
    const wait = (pattern: (typeof PATTERNS)[number]): number => {
      const run = quietRun();
      const dice = seq((PATTERNS.indexOf(pattern) + 0.5) / PATTERNS.length, 0.5);
      run.spawn = 1;
      stepRun(run, dice);
      return run.spawn;
    };
    expect(wait('under-bridge')).toBeGreaterThan(wait('crate') + 30);
    expect(wait('boss')).toBeGreaterThan(wait('crate') + 29);
  });
});

describe('hazards', () => {
  it('ends the run when the skater hits a crate', () => {
    const run = quietRun();
    run.items.push(item({ type: 'crate', x: 150 }));
    expect(stepRun(run, half)).toContain('wipeout');
    expect(run.over).toBe(true);
    const frame = run.frame;
    expect(stepRun(run, half)).toEqual([]);
    expect(run.frame).toBe(frame);
  });

  it('lets a skater in the air clear a crate', () => {
    const run = quietRun();
    run.player.y = 190;
    run.player.vy = -16;
    run.items.push(item({ type: 'crate', x: 150 }));
    expect(stepRun(run, half)).not.toContain('wipeout');
    expect(run.over).toBe(false);
  });

  it('drops a skater on the ground into a pit, but not one in the air', () => {
    const grounded = quietRun();
    grounded.items.push(item({ type: 'pit', x: 135, w: 140 }));
    expect(stepRun(grounded, half)).toContain('wipeout');

    const flying = quietRun();
    flying.player.y = 200;
    flying.items.push(item({ type: 'pit', x: 135, w: 140 }));
    expect(stepRun(flying, half)).not.toContain('wipeout');
  });

  it('lets a Shield absorb one hit and destroys that hazard', () => {
    const run = quietRun();
    run.shield = true;
    run.items.push(item({ type: 'crate', x: 150 }));
    expect(stepRun(run, half)).toEqual(['shield-hit']);
    expect(run.shield).toBe(false);
    expect(run.over).toBe(false);
    expect(run.items.some((o) => o.type === 'crate')).toBe(false);
    // The original left the hazard in place, so the skater died on the very next step.
    expect(stepRun(run, half)).not.toContain('wipeout');
    expect(run.over).toBe(false);
  });

  it('sizes a spike strip from the hazard, as the original did', () => {
    expect(hazardBox(item({ type: 'spikes', x: 100, w: 60 }), 0)).toEqual({ x: 104, y: GROUND - 34, w: 52, h: 34 });
  });

  it('does not count touching edges as a collision', () => {
    expect(collide({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(collide({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 0, w: 10, h: 10 })).toBe(true);
  });
});

describe('pickups', () => {
  const onSkater = { x: 175, y: 330 };

  it('collects a coin', () => {
    const run = quietRun();
    run.items.push(item({ type: 'coin', ...onSkater, w: 20, h: 20 }));
    expect(stepRun(run, half)).toEqual(['coin']);
    expect(run.runCoins).toBe(1);
    expect(run.items).toHaveLength(0);
  });

  it('turns each power-up on', () => {
    for (const [power, check] of [
      ['shield', (r: Run) => r.shield === true],
      ['magnet', (r: Run) => r.magnet === 600],
      ['turbo', (r: Run) => r.turbo === 240],
    ] as const) {
      const run = quietRun();
      run.items.push(item({ type: 'power', power, ...onSkater, w: 28, h: 28 }));
      expect(stepRun(run, half)).toEqual(['power']);
      expect(check(run)).toBe(true);
    }
  });

  it('pulls coins in while a magnet is active, and only the near ones', () => {
    const near = { x: 255, y: 275 };
    const far = { x: 500, y: 275 };
    const plain = quietRun();
    plain.items.push(item({ type: 'coin', ...near, w: 20, h: 20 }), item({ type: 'coin', ...far, w: 20, h: 20 }));
    steps(plain, 1);

    const magnet = quietRun();
    magnet.magnet = 600;
    magnet.items.push(item({ type: 'coin', ...near, w: 20, h: 20 }), item({ type: 'coin', ...far, w: 20, h: 20 }));
    steps(magnet, 1);

    expect(magnet.items[0].x).toBeCloseTo(plain.items[0].x - 2);
    expect(magnet.items[0].y).toBeGreaterThan(plain.items[0].y);
    expect(magnet.items[1].x).toBe(plain.items[1].x);
  });

  it('gives the Magnet Deck the same pull without a power-up', () => {
    const near = { x: 255, y: 275 };
    const plain = quietRun();
    plain.items.push(item({ type: 'coin', ...near, w: 20, h: 20 }));
    steps(plain, 1);
    const deck = quietRun('magnet');
    deck.items.push(item({ type: 'coin', ...near, w: 20, h: 20 }));
    steps(deck, 1);
    expect(deck.items[0].x).toBeCloseTo(plain.items[0].x - 2);
  });

  it('sweeps items away once they are well off the left edge', () => {
    const run = quietRun();
    run.items.push(item({ type: 'crate', x: -150 }), item({ type: 'crate', x: -60 }));
    steps(run, 1);
    expect(run.items).toHaveLength(1);
  });
});

describe('a whole run', () => {
  it('is the same every time for the same dice', () => {
    const play = (): string => {
      const run = createRun('basic');
      const random = seeded(99);
      for (let i = 0; i < 900; i++) {
        if (i % 40 === 0) jump(run, random);
        stepRun(run, random);
      }
      return JSON.stringify(run);
    };
    expect(play()).toBe(play());
  });

  it('never produces a broken number', () => {
    const run = createRun('magnet');
    const random = seeded(5);
    run.shield = true;
    for (let i = 0; i < 3000 && !run.over; i++) {
      if (i % 25 === 0) jump(run, random);
      stepRun(run, random);
    }
    const numbers = [run.score, run.speed, run.player.x, run.player.y, run.player.rot, ...run.items.flatMap((o) => [o.x, o.y])];
    for (const v of numbers) expect(Number.isFinite(v)).toBe(true);
  });
});
