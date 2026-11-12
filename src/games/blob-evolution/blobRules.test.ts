import { describe, expect, it } from 'vitest';
import {
  ARENA,
  BOT_CHASE_RANGE,
  BOT_COUNT,
  BOT_RESPONSE,
  PLAYER_RESPONSE,
  PLAYER_START_STAGE,
  approach,
  botStagePlan,
  canEat,
  findChaseTarget,
  spawnPoint,
  wanderTarget,
} from './blobRules';

/** Deterministic random source cycling through the given values. */
function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('canEat', () => {
  it('lets a blob eat only the stage directly below it', () => {
    expect(canEat(1, 0)).toBe(true);
    expect(canEat(2, 1)).toBe(true);
    expect(canEat(3, 2)).toBe(true);
    expect(canEat(2, 0)).toBe(false);
    expect(canEat(3, 0)).toBe(false);
    expect(canEat(3, 1)).toBe(false);
  });

  it('never lets a blob eat its own stage or a bigger one', () => {
    for (let a = 0; a <= 3; a++) {
      expect(canEat(a, a)).toBe(false);
      expect(canEat(a, a + 1)).toBe(false);
    }
  });

  it('leaves Purple unable to eat anything', () => {
    for (let prey = 0; prey <= 5; prey++) expect(canEat(0, prey)).toBe(false);
  });

  it('lets Rainbow eat every lower stage but not another Rainbow', () => {
    for (let prey = 0; prey <= 3; prey++) expect(canEat(4, prey)).toBe(true);
    expect(canEat(4, 4)).toBe(false);
  });
});

describe('start of a game', () => {
  it('starts the player as Blue so Purple blobs are edible', () => {
    expect(PLAYER_START_STAGE).toBe(1);
    expect(canEat(PLAYER_START_STAGE, 0)).toBe(true);
  });

  it('plans half Purple and half Blue bots', () => {
    const plan = botStagePlan(BOT_COUNT);
    expect(plan).toHaveLength(BOT_COUNT);
    expect(plan.filter((s) => s === 0)).toHaveLength(BOT_COUNT / 2);
    expect(plan.filter((s) => s === 1)).toHaveLength(BOT_COUNT / 2);
  });

  it('shuffles the plan with the injected random source', () => {
    const a = botStagePlan(10, seq(0.1, 0.9, 0.3, 0.7));
    const b = botStagePlan(10, seq(0.1, 0.9, 0.3, 0.7));
    expect(a).toEqual(b);
    expect(a).not.toEqual([0, 0, 0, 0, 0, 1, 1, 1, 1, 1]);
  });

  it('keeps spawn points inside the arena and away from the player', () => {
    for (let i = 0; i < 200; i++) {
      const { x, z } = spawnPoint();
      expect(Math.abs(x)).toBeLessThanOrEqual(ARENA);
      expect(Math.abs(z)).toBeLessThanOrEqual(ARENA);
      expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(5);
    }
  });

  it('still returns a spawn point when the random source keeps landing at the centre', () => {
    const point = spawnPoint(() => 0.5);
    expect(Math.hypot(point.x, point.z)).toBeGreaterThanOrEqual(5);
  });
});

describe('movement pacing', () => {
  /** Simulate `seconds` of holding a direction at a given frame rate. */
  function distanceTravelled(topSpeed: number, response: number, fps: number, seconds: number): number {
    const dt = Math.min(1 / fps, 0.04);
    let v = 0;
    let x = 0;
    for (let i = 0; i < Math.round(seconds * fps); i++) {
      v = approach(v, topSpeed, dt, response);
      x += v * dt;
    }
    return x;
  }

  it('never exceeds the stage speed, in units per second', () => {
    let v = 0;
    for (let i = 0; i < 600; i++) v = approach(v, 3.05, 1 / 60, PLAYER_RESPONSE);
    expect(v).toBeLessThanOrEqual(3.05);
    expect(v).toBeGreaterThan(3.04);
  });

  it('covers about the same ground at 30, 60 and 144 fps', () => {
    const at30 = distanceTravelled(3.05, PLAYER_RESPONSE, 30, 5);
    const at60 = distanceTravelled(3.05, PLAYER_RESPONSE, 60, 5);
    const at144 = distanceTravelled(3.05, PLAYER_RESPONSE, 144, 5);
    expect(Math.abs(at30 - at60)).toBeLessThan(0.6);
    expect(Math.abs(at144 - at60)).toBeLessThan(0.3);
  });

  it('takes a Blue blob roughly 15 units in five seconds, not the whole arena', () => {
    const d = distanceTravelled(3.05, PLAYER_RESPONSE, 60, 5);
    expect(d).toBeGreaterThan(12);
    expect(d).toBeLessThan(16);
  });

  it('makes bots slower to get going than the player', () => {
    const player = distanceTravelled(3.05, PLAYER_RESPONSE, 60, 1);
    const bot = distanceTravelled(3.05, BOT_RESPONSE, 60, 1);
    expect(bot).toBeLessThan(player);
  });

  it('keeps one long frame from overshooting', () => {
    expect(approach(0, 4, 10, PLAYER_RESPONSE)).toBe(4);
  });
});

describe('findChaseTarget', () => {
  const blue = { stage: 1, x: 0, z: 0, alive: true };

  it('ignores the player when the bot cannot eat them', () => {
    const purple = { stage: 0, x: 3, z: 0 };
    expect(findChaseTarget(purple, blue, [])).toBeNull();
    const sameStage = { stage: 1, x: 3, z: 0 };
    expect(findChaseTarget(sameStage, blue, [])).toBeNull();
  });

  it('chases the player only when the bot can eat them and is in range', () => {
    const green = { stage: 2, x: 6, z: 0 };
    expect(findChaseTarget(green, blue, [])).toEqual({ x: 0, z: 0 });
    const farGreen = { stage: 2, x: BOT_CHASE_RANGE + 1, z: 0 };
    expect(findChaseTarget(farGreen, blue, [])).toBeNull();
  });

  it('goes for the nearest meal, which can be another bot', () => {
    const green = { stage: 2, x: 10, z: 0 };
    const nearBlue = { stage: 1, x: 12, z: 0, alive: true };
    expect(findChaseTarget(green, blue, [nearBlue])).toEqual({ x: 12, z: 0 });
  });

  it('skips dead bots and itself', () => {
    const green = { stage: 2, x: 10, z: 0, alive: true };
    const deadBlue = { stage: 1, x: 11, z: 0, alive: false };
    expect(findChaseTarget(green, null, [green, deadBlue])).toBeNull();
  });

  it('lets Rainbow bots hunt each other', () => {
    const a = { stage: 4, x: 0, z: 0, alive: true };
    const b = { stage: 4, x: 5, z: 0, alive: true };
    expect(findChaseTarget(a, null, [a, b])).toEqual({ x: 5, z: 0 });
  });

  it('does not make every bot in the arena converge on the player', () => {
    // The player is Blue. Only bots above Blue can eat them; Purple and Blue bots ignore them.
    const bots = Array.from({ length: 42 }, (_, i) => ({
      stage: i % 2,
      x: 8,
      z: 0,
      alive: true,
    }));
    const chasing = bots.filter((bot) => {
      const target = findChaseTarget(bot, blue, bots);
      return target !== null && target.x === 0 && target.z === 0;
    });
    expect(chasing).toHaveLength(0);
  });
});

describe('wanderTarget', () => {
  it('stays inside the arena wall', () => {
    const edge = { stage: 0, x: ARENA, z: -ARENA };
    for (const r of [0, 0.5, 1]) {
      const t = wanderTarget(edge, () => r);
      expect(Math.abs(t.x)).toBeLessThanOrEqual(ARENA - 2);
      expect(Math.abs(t.z)).toBeLessThanOrEqual(ARENA - 2);
    }
  });

  it('picks a point near the bot', () => {
    const t = wanderTarget({ stage: 0, x: 0, z: 0 }, () => 1);
    expect(t.x).toBeCloseTo(7.5);
    expect(t.z).toBeCloseTo(7.5);
  });
});
