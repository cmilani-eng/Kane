import { describe, expect, it } from 'vitest';
import {
  ARENA,
  BOT_CHASE_RANGE,
  BOT_COUNT,
  BOT_THINK_MIN,
  BOT_THINK_SPREAD,
  BOT_WANDER_CHANCE,
  STAGES,
  botStagePlan,
  findChaseTarget,
  spawnPoint,
  stepBot,
  stepPlayer,
  wanderTarget,
} from './blobRules';
import {
  BLACK_HOLE_PULL_MAX,
  BLACK_HOLE_PULL_RADIUS,
  HARMLESS_GAP,
  HARMLESS_MAX,
  HARMLESS_START_CLEARANCE,
  HARMLESS_WALL_MARGIN,
  HAZARD_FIRST_SPAWN_MIN,
  HAZARD_KINDS,
  HAZARD_LIFETIME_SECONDS,
  HAZARD_MAX_ACTIVE,
  HAZARD_PLAYER_CLEARANCE,
  HAZARD_SPAWN_RANGE,
  HAZARD_SPECS,
  HAZARD_WARNING_SECONDS,
  PUDDLE_SPEED_FACTOR,
  TREE_MIN_KICK,
  type HarmlessObstacle,
  type HazardField,
  type HazardKind,
  applySuction,
  bounceOffTrees,
  createHazardField,
  deadlyHazardFor,
  hazardMayTake,
  pickHarmlessCount,
  planHarmlessObstacles,
  puddleSpeedFactor,
  spawnHazard,
  steerAroundObstacles,
  stepHazardField,
  suctionSpeed,
  treeContactDistance,
} from './blobObstacles';

/** Small seeded generator (mulberry32), so every run of a test sees the same "random" game. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BLUE = STAGES[1];
const PLAYER = { x: 0, z: 0, radius: BLUE.radius };
const FRAME_RATES = [30, 60, 144];

/** A field that never spawns by itself, for tests that place their own hazards. */
function quietField(): HazardField {
  const field = createHazardField(seeded(1));
  field.spawnIn = Infinity;
  return field;
}

/** Advance the field by `seconds` of play at a frame rate. */
function run(field: HazardField, seconds: number, fps = 60, random = seeded(7), player = PLAYER): void {
  for (let i = 0; i < Math.round(seconds * fps); i++) stepHazardField(field, 1 / fps, player, [], random);
}

/** An active hazard of `kind` at a spot, ready to hurt. */
function activeHazard(kind: HazardKind, x = 0, z = 0) {
  const field = quietField();
  const hazard = spawnHazard(field, kind, x, z, seeded(3));
  hazard.phase = 'active';
  return { field, hazard };
}

function mover(x: number, z: number, radius: number = BLUE.radius) {
  return { x, z, vx: 0, vz: 0, radius };
}

const tree = (x: number, z: number, radius = 1.5): HarmlessObstacle => ({ kind: 'tree', x, z, radius });
const puddle = (x: number, z: number, radius = 3): HarmlessObstacle => ({ kind: 'puddle', x, z, radius });

describe('how many harmless obstacles a game gets', () => {
  it('is always between none and five, and every total comes up', () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 2000; seed++) {
      const count = pickHarmlessCount(seeded(seed));
      expect(Number.isInteger(count)).toBe(true);
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(HARMLESS_MAX);
      seen.add(count);
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('follows the injected random source to both ends of the range', () => {
    expect(pickHarmlessCount(() => 0)).toBe(0);
    expect(pickHarmlessCount(() => 0.999999)).toBe(5);
    expect(pickHarmlessCount(() => 1)).toBe(5);
  });
});

describe('laying out harmless obstacles', () => {
  it('places exactly the requested number, as a mix of trees and puddles', () => {
    const kinds = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      for (let count = 0; count <= HARMLESS_MAX; count++) {
        const layout = planHarmlessObstacles(count, seeded(seed * 10 + count));
        expect(layout).toHaveLength(count);
        for (const o of layout) kinds.add(o.kind);
      }
    }
    expect([...kinds].sort()).toEqual(['puddle', 'tree']);
  });

  it('keeps them inside the arena, off the start point and apart from each other', () => {
    for (let seed = 0; seed < 600; seed++) {
      const layout = planHarmlessObstacles(HARMLESS_MAX, seeded(seed));
      layout.forEach((a, i) => {
        expect(Math.abs(a.x) + a.radius).toBeLessThanOrEqual(ARENA - HARMLESS_WALL_MARGIN + 1e-9);
        expect(Math.abs(a.z) + a.radius).toBeLessThanOrEqual(ARENA - HARMLESS_WALL_MARGIN + 1e-9);
        expect(Math.hypot(a.x, a.z) - a.radius).toBeGreaterThanOrEqual(HARMLESS_START_CLEARANCE - 1e-9);
        for (const b of layout.slice(i + 1)) {
          expect(Math.hypot(a.x - b.x, a.z - b.z) - a.radius - b.radius).toBeGreaterThanOrEqual(HARMLESS_GAP - 1e-9);
        }
      });
    }
  });

  it('still keeps its promises when the random source never moves', () => {
    for (const value of [0, 0.5, 0.999999]) {
      const layout = planHarmlessObstacles(HARMLESS_MAX, () => value);
      expect(layout).toHaveLength(HARMLESS_MAX);
      layout.forEach((a, i) => {
        expect(Math.hypot(a.x, a.z) - a.radius).toBeGreaterThanOrEqual(HARMLESS_START_CLEARANCE);
        for (const b of layout.slice(i + 1)) {
          expect(Math.hypot(a.x - b.x, a.z - b.z) - a.radius - b.radius).toBeGreaterThanOrEqual(HARMLESS_GAP);
        }
      });
    }
  });

  it('is a pure function of its inputs', () => {
    expect(planHarmlessObstacles(4, seeded(42))).toEqual(planHarmlessObstacles(4, seeded(42)));
  });
});

describe('when and where deadly obstacles appear', () => {
  it('gives a calm start before the first one', () => {
    for (let seed = 0; seed < 50; seed++) {
      const random = seeded(seed);
      const field = createHazardField(random);
      run(field, HAZARD_FIRST_SPAWN_MIN - 0.1, 60, random);
      expect(field.hazards).toHaveLength(0);
    }
  });

  it('starts every one as a warning, never on or next to the player, and caps how many there are', () => {
    const kinds = new Set<string>();
    let spawned = 0;
    // Centre, an edge and a corner: the corner leaves the least room to spawn into.
    const spots = [
      { x: 0, z: 0 },
      { x: ARENA - 1, z: 3 },
      { x: -(ARENA - 1), z: -(ARENA - 1) },
    ];
    for (let seed = 0; seed < 60; seed++) {
      const random = seeded(seed);
      const field = createHazardField(random);
      const player = { ...spots[seed % spots.length], radius: STAGES[4].radius };
      const known = new Set<number>();
      for (let frame = 0; frame < 120 * 30; frame++) {
        stepHazardField(field, 1 / 30, player, [], random);
        expect(field.hazards.length).toBeLessThanOrEqual(HAZARD_MAX_ACTIVE);
        for (const hazard of field.hazards) {
          if (known.has(hazard.id)) continue;
          known.add(hazard.id);
          spawned++;
          kinds.add(hazard.kind);
          expect(hazard.phase).toBe('warning');
          const centre = Math.hypot(hazard.x - player.x, hazard.z - player.z);
          expect(centre - hazard.radius - player.radius).toBeGreaterThanOrEqual(HAZARD_PLAYER_CLEARANCE - 1e-9);
          if (hazard.kind === 'blackHole') {
            expect(centre).toBeGreaterThanOrEqual(BLACK_HOLE_PULL_RADIUS);
          }
          expect(centre).toBeLessThanOrEqual(HAZARD_SPAWN_RANGE + 1e-9);
          expect(Math.abs(hazard.x) + hazard.radius).toBeLessThanOrEqual(ARENA);
          expect(Math.abs(hazard.z) + hazard.radius).toBeLessThanOrEqual(ARENA);
        }
      }
    }
    expect(spawned).toBeGreaterThan(300);
    expect([...kinds].sort()).toEqual([...HAZARD_KINDS].sort());
  });

  it('does not open a black hole on top of a harmless obstacle', () => {
    const trees = planHarmlessObstacles(HARMLESS_MAX, seeded(5));
    for (let seed = 0; seed < 40; seed++) {
      const random = seeded(seed);
      const field = createHazardField(random);
      for (let frame = 0; frame < 90 * 30; frame++) {
        stepHazardField(field, 1 / 30, PLAYER, trees, random);
        for (const hazard of field.hazards) {
          if (hazard.kind !== 'blackHole') continue;
          for (const o of trees) {
            expect(Math.hypot(hazard.x - o.x, hazard.z - o.z)).toBeGreaterThan(o.radius + hazard.radius);
          }
        }
      }
    }
  });
});

describe('a deadly obstacle lasts ten seconds of play', () => {
  it('does not count the warning toward the ten seconds', () => {
    const field = quietField();
    const hazard = spawnHazard(field, 'blackHole', 12, 0, seeded(2));
    run(field, HAZARD_WARNING_SECONDS - 0.1);
    expect(hazard.phase).toBe('warning');
    run(field, 0.2);
    expect(hazard.phase).toBe('active');
    run(field, HAZARD_LIFETIME_SECONDS - 0.2);
    expect(field.hazards).toContain(hazard);
    run(field, 0.2);
    expect(field.hazards).not.toContain(hazard);
  });

  it.each(FRAME_RATES)('stays active for ten seconds at %i fps', (fps) => {
    const field = quietField();
    spawnHazard(field, 'tornado', 12, 0, seeded(2));
    let activeFrames = 0;
    const random = seeded(8);
    for (let i = 0; i < fps * 20; i++) {
      stepHazardField(field, 1 / fps, PLAYER, [], random);
      if (field.hazards[0]?.phase === 'active') activeFrames++;
    }
    expect(Math.abs(activeFrames / fps - HAZARD_LIFETIME_SECONDS)).toBeLessThanOrEqual(1 / fps + 1e-9);
    expect(field.hazards).toHaveLength(0);
  });

  it('does not move on, spawn or expire while no simulation time passes', () => {
    const field = createHazardField(seeded(4));
    spawnHazard(field, 'tornado', 12, 0, seeded(2));
    run(field, 4);
    const before = structuredClone(field);
    const random = seeded(9);
    for (let i = 0; i < 100_000; i++) stepHazardField(field, 0, PLAYER, [], random);
    stepHazardField(field, -1, PLAYER, [], random);
    stepHazardField(field, Number.NaN, PLAYER, [], random);
    expect(field).toEqual(before);
  });
});

describe('a warning is only a warning', () => {
  it('neither kills nor pulls a blob sitting on the marker', () => {
    for (const kind of HAZARD_KINDS) {
      const field = quietField();
      spawnHazard(field, kind, 0, 0, seeded(2));
      const body = mover(0.5, 0);
      applySuction(body, field.hazards, 1);
      expect(body).toEqual(mover(0.5, 0));
      expect(deadlyHazardFor(body, field.hazards)).toBeNull();
    }
  });

  it('holds a moving hazard still until it turns deadly, so the marker is honest', () => {
    for (const kind of ['tornado', 'redBlob'] as const) {
      const field = quietField();
      const hazard = spawnHazard(field, kind, 10, 4, seeded(2));
      run(field, HAZARD_WARNING_SECONDS - 0.05);
      expect(hazard.x).toBe(10);
      expect(hazard.z).toBe(4);
    }
  });
});

describe('deadly contact', () => {
  it.each(HAZARD_KINDS)('%s kills a blob that touches it and spares one that is clear', (kind) => {
    const { field, hazard } = activeHazard(kind);
    expect(deadlyHazardFor(mover(0, 0), field.hazards)).toBe(hazard);
    expect(deadlyHazardFor(mover(hazard.radius, 0), field.hazards)).toBe(hazard);
    expect(deadlyHazardFor(mover(hazard.radius + BLUE.radius + 0.1, 0), field.hazards)).toBeNull();
  });

  it('makes the giant red blob much bigger than any evolving blob', () => {
    expect(HAZARD_SPECS.redBlob.radius).toBeGreaterThan(STAGES[5].radius * 2);
  });

  it('never lets a hazard take the last bot, so only the player can empty the arena', () => {
    expect(hazardMayTake(2)).toBe(true);
    expect(hazardMayTake(BOT_COUNT)).toBe(true);
    expect(hazardMayTake(1)).toBe(false);
    expect(hazardMayTake(0)).toBe(false);
  });
});

describe('moving hazards', () => {
  it.each(['tornado', 'redBlob'] as const)('%s travels around the arena', (kind) => {
    const field = quietField();
    const hazard = spawnHazard(field, kind, 0, 0, seeded(11));
    run(field, HAZARD_WARNING_SECONDS);
    let travelled = 0;
    const random = seeded(12);
    let { x, z } = hazard;
    for (let i = 0; i < 9 * 60; i++) {
      stepHazardField(field, 1 / 60, PLAYER, [], random);
      travelled += Math.hypot(hazard.x - x, hazard.z - z);
      expect(Math.hypot(hazard.x - x, hazard.z - z)).toBeLessThanOrEqual(HAZARD_SPECS[kind].speed / 60 + 1e-6);
      ({ x, z } = hazard);
    }
    expect(travelled).toBeGreaterThan(HAZARD_SPECS[kind].speed * 6);
  });

  it('keeps the black hole where it opened', () => {
    const field = quietField();
    const hazard = spawnHazard(field, 'blackHole', 8, -3, seeded(2));
    run(field, HAZARD_WARNING_SECONDS + HAZARD_LIFETIME_SECONDS - 0.1);
    expect(hazard.x).toBe(8);
    expect(hazard.z).toBe(-3);
  });

  it('lets the starting blob outrun both moving hazards', () => {
    expect(HAZARD_SPECS.tornado.speed).toBeLessThan(BLUE.speed);
    expect(HAZARD_SPECS.redBlob.speed).toBeLessThan(STAGES[0].speed);
  });

  it('never lets one leave the arena, even when it starts against the wall', () => {
    for (let seed = 0; seed < 150; seed++) {
      const kind = seed % 2 ? 'tornado' : 'redBlob';
      const field = quietField();
      const edge = ARENA - HAZARD_SPECS[kind].radius;
      const sx = seed % 3 === 0 ? -edge : edge;
      const sz = seed % 5 === 0 ? -edge : edge;
      const hazard = spawnHazard(field, kind, sx, sz, seeded(seed));
      const random = seeded(seed + 1000);
      for (let i = 0; i < 12 * 30; i++) {
        stepHazardField(field, 1 / 30, PLAYER, [], random);
        expect(Math.abs(hazard.x)).toBeLessThanOrEqual(edge + 1e-9);
        expect(Math.abs(hazard.z)).toBeLessThanOrEqual(edge + 1e-9);
      }
    }
  });
});

describe('black hole suction', () => {
  const core = HAZARD_SPECS.blackHole.radius;

  it('grows stronger the closer a blob gets, and ends at the rim', () => {
    expect(suctionSpeed(BLACK_HOLE_PULL_RADIUS)).toBe(0);
    expect(suctionSpeed(BLACK_HOLE_PULL_RADIUS + 5)).toBe(0);
    let previous = 0;
    for (let d = BLACK_HOLE_PULL_RADIUS - 0.25; d > core; d -= 0.25) {
      expect(suctionSpeed(d)).toBeGreaterThan(previous);
      previous = suctionSpeed(d);
    }
    expect(suctionSpeed(core)).toBeCloseTo(BLACK_HOLE_PULL_MAX);
    expect(suctionSpeed(0)).toBe(BLACK_HOLE_PULL_MAX);
  });

  it('draws a resting blob into the deadly core without flinging it out the other side', () => {
    const { field, hazard } = activeHazard('blackHole');
    const body = mover(6, 0);
    let caught = false;
    for (let i = 0; i < 60 * 10 && !caught; i++) {
      applySuction(body, field.hazards, 1 / 60);
      expect(body.x).toBeGreaterThanOrEqual(hazard.x);
      caught = deadlyHazardFor(body, field.hazards) !== null;
    }
    expect(caught).toBe(true);
    for (let i = 0; i < 600; i++) applySuction(body, field.hazards, 1 / 30);
    expect(body.x).toBeGreaterThanOrEqual(hazard.x);
    expect(body.x).toBeCloseTo(hazard.x, 5);
  });

  /** A player starting at `from` and holding straight away from a black hole at the centre. */
  function flee(stage: number, from: number, fps = 60): 'escaped' | 'caught' | 'stuck' {
    const { field } = activeHazard('blackHole');
    const body = mover(from, 0, STAGES[stage].radius);
    for (let i = 0; i < fps * HAZARD_LIFETIME_SECONDS; i++) {
      stepPlayer(body, 1, 0, STAGES[stage].speed, 1 / fps, 1);
      applySuction(body, field.hazards, 1 / fps);
      if (deadlyHazardFor(body, field.hazards)) return 'caught';
      if (body.x > BLACK_HOLE_PULL_RADIUS) return 'escaped';
    }
    return 'stuck';
  }

  it.each(FRAME_RATES)('lets a fast player at the outer edge escape at %i fps', (fps) => {
    for (const stage of [1, 2, 3, 4]) {
      expect(flee(stage, BLACK_HOLE_PULL_RADIUS * 0.8, fps)).toBe('escaped');
    }
  });

  it('lets even the slowest blob escape from the rim', () => {
    expect(flee(0, BLACK_HOLE_PULL_RADIUS * 0.8)).toBe('escaped');
  });

  it('wins against a Blue blob that strays close, while the fastest can still break free there', () => {
    expect(flee(1, 3)).toBe('caught');
    expect(flee(4, 3)).toBe('escaped');
  });
});

describe('trees', () => {
  const radius = BLUE.radius;

  it('bounce a blob off: it is put back on the surface and sent away', () => {
    const wood = [tree(0, 0)];
    const body = { x: 1.4, z: 0, vx: -3, vz: 1, radius };
    expect(bounceOffTrees(body, wood)).toBe(true);
    expect(body.x).toBeCloseTo(treeContactDistance(wood[0], radius));
    expect(body.vx).toBeGreaterThan(0);
    expect(body.vz).toBeCloseTo(1);
  });

  it('give even a slow blob a visible kick', () => {
    const body = { x: 1.4, z: 0, vx: -0.05, vz: 0, radius };
    bounceOffTrees(body, [tree(0, 0)]);
    expect(body.vx).toBeGreaterThanOrEqual(TREE_MIN_KICK);
  });

  it('leave a blob that is already moving away alone', () => {
    const body = { x: treeContactDistance(tree(0, 0), radius) - 0.01, z: 0, vx: 4, vz: 0, radius };
    bounceOffTrees(body, [tree(0, 0)]);
    expect(body.vx).toBe(4);
  });

  it('push out even a blob sitting dead centre', () => {
    const body = mover(0, 0);
    bounceOffTrees(body, [tree(0, 0)]);
    expect(Math.hypot(body.x, body.z)).toBeCloseTo(treeContactDistance(tree(0, 0), radius));
    expect(Number.isFinite(body.vx) && Number.isFinite(body.vz)).toBe(true);
  });

  it.each(FRAME_RATES)('never let a blob get inside while it keeps pushing, at %i fps', (fps) => {
    for (const stage of [0, 1, 4, 5]) {
      const wood = [tree(0, 0)];
      const body = mover(-6, 0.01, STAGES[stage].radius);
      for (let i = 0; i < fps * 6; i++) {
        stepPlayer(body, 1, 0, STAGES[stage].speed, 1 / fps, 1);
        bounceOffTrees(body, wood);
        expect(Math.hypot(body.x, body.z)).toBeGreaterThanOrEqual(treeContactDistance(wood[0], body.radius) - 1e-9);
      }
    }
  });

  it('do not trap a blob that brushes past', () => {
    const wood = [tree(0, 0)];
    const body = mover(-6, 0.6);
    for (let i = 0; i < 60 * 8; i++) {
      stepPlayer(body, 1, 0, BLUE.speed, 1 / 60, 1);
      bounceOffTrees(body, wood);
    }
    expect(body.x).toBeGreaterThan(4);
  });

  it('are the only thing that bounces: puddles are walked through', () => {
    const body = { x: 0.5, z: 0, vx: -3, vz: 0, radius };
    expect(bounceOffTrees(body, [puddle(0, 0)])).toBe(false);
    expect(body).toEqual({ x: 0.5, z: 0, vx: -3, vz: 0, radius });
  });
});

describe('puddles', () => {
  const water = [puddle(0, 0, 3), tree(10, 0)];

  it('slow a blob only while it is inside', () => {
    expect(puddleSpeedFactor(0, 0, water)).toBe(PUDDLE_SPEED_FACTOR);
    expect(puddleSpeedFactor(2.9, 0, water)).toBe(PUDDLE_SPEED_FACTOR);
    expect(puddleSpeedFactor(3.1, 0, water)).toBe(1);
    expect(puddleSpeedFactor(10, 0, water)).toBe(1);
    expect(PUDDLE_SPEED_FACTOR).toBeGreaterThan(0);
    expect(PUDDLE_SPEED_FACTOR).toBeLessThan(1);
  });

  it('cut the ground covered, and full pace returns as soon as the blob is out', () => {
    const body = { ...mover(0, 0), vx: BLUE.speed };
    stepPlayer(body, 1, 0, BLUE.speed, 0.02, PUDDLE_SPEED_FACTOR);
    expect(body.x).toBeCloseTo(BLUE.speed * 0.02 * PUDDLE_SPEED_FACTOR);
    const before = body.x;
    stepPlayer(body, 1, 0, BLUE.speed, 0.02, 1);
    expect(body.x - before).toBeCloseTo(BLUE.speed * 0.02);
  });

  it('slow bots as well', () => {
    const bot = { ...mover(0, 0), vx: 3, speed: 3, tx: 20, tz: 0 };
    stepBot(bot, 1, 0, 0.02, PUDDLE_SPEED_FACTOR);
    expect(bot.x).toBeCloseTo(3 * 0.02 * PUDDLE_SPEED_FACTOR);
  });

  it('harm nobody', () => {
    expect(deadlyHazardFor(mover(0, 0), [])).toBeNull();
  });
});

describe('the same game at any frame rate', () => {
  it('spawns, moves and removes the same hazards at 30, 60 and 144 fps', () => {
    const play = (fps: number) => {
      const random = seeded(2026);
      const field = createHazardField(random);
      const snapshots: { id: number; kind: string; phase: string; x: number; z: number }[][] = [];
      for (let second = 0; second < 60; second++) {
        for (let i = 0; i < fps; i++) stepHazardField(field, 1 / fps, PLAYER, [], random);
        snapshots.push(field.hazards.map(({ id, kind, phase, x, z }) => ({ id, kind, phase, x, z })));
      }
      return snapshots;
    };
    const at60 = play(60);
    expect(at60.some((s) => s.length > 0)).toBe(true);
    for (const fps of [30, 144]) {
      const other = play(fps);
      other.forEach((hazards, second) => {
        expect(hazards.map((h) => `${h.id}:${h.kind}:${h.phase}`)).toEqual(at60[second].map((h) => `${h.id}:${h.kind}:${h.phase}`));
        hazards.forEach((h, i) => {
          expect(Math.abs(h.x - at60[second][i].x)).toBeLessThan(0.05);
          expect(Math.abs(h.z - at60[second][i].z)).toBeLessThan(0.05);
        });
      });
    }
  });

  it('pulls, slows and bounces a blob to about the same place', () => {
    const play = (fps: number) => {
      const { field } = activeHazard('blackHole', 0, 6);
      const scenery = [puddle(4, 0, 2.5), tree(11, 0)];
      const body = mover(-5, 0);
      for (let i = 0; i < fps * 3; i++) {
        stepPlayer(body, 1, 0, BLUE.speed, 1 / fps, puddleSpeedFactor(body.x, body.z, scenery));
        applySuction(body, field.hazards, 1 / fps);
        bounceOffTrees(body, scenery);
      }
      return body;
    };
    const at60 = play(60);
    for (const fps of [30, 144]) {
      const other = play(fps);
      expect(Math.hypot(other.x - at60.x, other.z - at60.z)).toBeLessThan(0.3);
    }
  });
});

describe('bots steer clear', () => {
  const out = { x: 0, z: 0 };

  it('leaves a bot on its way when nothing is near', () => {
    const { field } = activeHazard('tornado', 30, 30);
    steerAroundObstacles(mover(0, 0), 0.6, 0.8, field.hazards, [tree(-20, 0)], out);
    expect(out).toEqual({ x: 0.6, z: 0.8 });
  });

  it.each(HAZARD_KINDS)('turns a bot away from a %s, even while it is only a warning', (kind) => {
    const field = quietField();
    spawnHazard(field, kind, 0, 0, seeded(2));
    const bot = mover(-(HAZARD_SPECS[kind].radius + 1.5), 0);
    steerAroundObstacles(bot, 1, 0, field.hazards, [], out);
    expect(out.x).toBeLessThan(0);
    expect(Math.hypot(out.x, out.z)).toBeCloseTo(1);
  });

  it('moves an idle bot out of the way', () => {
    const { field } = activeHazard('redBlob', 0, 0);
    steerAroundObstacles(mover(0, 4), 0, 0, field.hazards, [], out);
    expect(out.z).toBeGreaterThan(0.9);
  });

  it('leads a bot around a tree instead of into it', () => {
    steerAroundObstacles(mover(-2.6, 0.1), 1, 0, [], [tree(0, 0)], out);
    expect(out.x).toBeLessThan(0.7);
    expect(out.z).toBeGreaterThan(0.5);
  });

  /**
   * Forty-two bots left to themselves among the obstacles, moved by the same functions the
   * scene uses. They do not eat each other here, so the field stays as crowded as it can be.
   */
  function botsTaken(seed: number, seconds: number, avoid: boolean): number {
    const random = seeded(seed);
    const scenery = planHarmlessObstacles(pickHarmlessCount(random), random);
    const field = createHazardField(random);
    const bots = botStagePlan(BOT_COUNT, random).map((stage) => {
      const { x, z } = spawnPoint(random);
      const { radius, speed } = STAGES[stage];
      return { stage, radius, speed, x, z, vx: 0, vz: 0, tx: x, tz: z, think: 0, alive: true };
    });
    const dir = { x: 0, z: 0 };
    const dt = 1 / 30;
    let taken = 0;
    for (let frame = 0; frame < seconds / dt; frame++) {
      stepHazardField(field, dt, PLAYER, scenery, random);
      for (const bot of bots) {
        if (!bot.alive) continue;
        bot.think -= dt;
        if (bot.think <= 0) {
          bot.think = BOT_THINK_MIN + random() * BOT_THINK_SPREAD;
          const chase = findChaseTarget(bot, null, bots, BOT_CHASE_RANGE);
          const next = chase ?? (random() < BOT_WANDER_CHANCE ? wanderTarget(bot, random) : null);
          if (next) {
            bot.tx = next.x;
            bot.tz = next.z;
          }
        }
        const dx = bot.tx - bot.x;
        const dz = bot.tz - bot.z;
        const dist = Math.hypot(dx, dz);
        dir.x = dist > 0.2 ? dx / dist : 0;
        dir.z = dist > 0.2 ? dz / dist : 0;
        if (avoid) steerAroundObstacles(bot, dir.x, dir.z, field.hazards, scenery, dir);
        stepBot(bot, dir.x, dir.z, dt, puddleSpeedFactor(bot.x, bot.z, scenery));
        applySuction(bot, field.hazards, dt);
        if (deadlyHazardFor(bot, field.hazards)) {
          bot.alive = false;
          taken++;
        }
        bounceOffTrees(bot, scenery);
      }
    }
    return taken;
  }

  it('so hazards claim only a few bots in two minutes: no free wins', () => {
    const games = 20;
    let careful = 0;
    let careless = 0;
    for (let seed = 0; seed < games; seed++) {
      careful += botsTaken(seed, 120, true);
      careless += botsTaken(seed, 120, false);
    }
    // Hazards stay deadly to bots, but dodging has to cut the toll by a lot.
    expect(careful / games).toBeLessThanOrEqual(3);
    expect(careful / games).toBeGreaterThan(0);
    expect(careless).toBeGreaterThan(careful * 3);
  }, 60_000);
});
