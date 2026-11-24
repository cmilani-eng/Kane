import { describe, expect, it } from 'vitest';
import {
  GROUND,
  HAZARD_TYPES,
  VIEW_W,
  WORLDS,
  collide,
  createRun,
  hazardBox,
  jump,
  spawnCoins,
  spawnItem,
  stepRun,
  type BoardId,
  type Item,
  type Run,
} from './skateRules';

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
  it('gives up to three jumps per airtime with growing lift', () => {
    const run = quietRun();
    expect(jump(run, half)).toBe(true);
    expect(run.player.vy).toBe(-13.2);
    expect(jump(run, half)).toBe(true);
    expect(run.player.vy).toBe(-16.5);
    expect(jump(run, half)).toBe(true);
    expect(run.player.vy).toBe(-17.5);
    expect(jump(run, half)).toBe(false);
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
    expect(run.items.filter((o) => o.type === 'roller')).toHaveLength(1);
    expect(run.items.filter((o) => o.type === 'coin')).toHaveLength(5);
    expect(run.spawn).toBeGreaterThanOrEqual(53);
  });

  it('"double" is spikes followed by a bird', () => {
    const run = quietRun();
    spawnItem(run, seq(0.97, 0.5, 0.5));
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
