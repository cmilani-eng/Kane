import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BlobObstacleField } from './blobObstacleField';
import {
  HARMLESS_GAP,
  HARMLESS_MAX,
  HARMLESS_START_CLEARANCE,
  HARMLESS_WALL_MARGIN,
  HAZARD_PLAYER_CLEARANCE,
  HAZARD_SPAWN_RANGE,
  createHazardField,
  planHarmlessObstacles,
  spawnHazard,
  stepHazardField,
} from './blobObstacles';
import { ARENA, BOT_COUNT, MAPS, MAP_IDS, STAGES, spawnPoint, stepBot, stepPlayer, wanderTarget } from './blobRules';

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

const [SMALL, MEDIUM, LARGE] = MAP_IDS.map((id) => MAPS[id]);
const BIG_MAPS = [MEDIUM, LARGE];
const BLUE = STAGES[1];

describe('the three maps', () => {
  it('are offered small, medium, large: the night arena, the playground and the castle', () => {
    expect([...MAP_IDS]).toEqual(['dark', 'playground', 'castle']);
    expect(MEDIUM.half).toBeGreaterThan(SMALL.half);
    expect(LARGE.half).toBeGreaterThan(MEDIUM.half);
    for (const id of MAP_IDS) expect(MAPS[id].id).toBe(id);
  });

  it('keep the original arena as the small one, untouched', () => {
    expect(SMALL.half).toBe(ARENA);
    expect(SMALL.bots).toBe(BOT_COUNT);
  });

  it('give a bigger map more blobs, but spread no thinner than half as densely', () => {
    const density = (m: { half: number; bots: number }) => m.bots / (m.half * 2) ** 2;
    expect(MEDIUM.bots).toBeGreaterThan(SMALL.bots);
    expect(LARGE.bots).toBeGreaterThan(MEDIUM.bots);
    for (const map of BIG_MAPS) {
      expect(density(map)).toBeLessThanOrEqual(density(SMALL));
      expect(density(map)).toBeGreaterThanOrEqual(density(SMALL) / 2);
    }
  });
});

describe('blobs use the whole of the chosen map', () => {
  it.each(BIG_MAPS)('spawn all over the $id and never outside it', ({ half }) => {
    const random = seeded(1);
    let farthest = 0;
    for (let i = 0; i < 2000; i++) {
      const { x, z } = spawnPoint(random, 5, half);
      expect(Math.max(Math.abs(x), Math.abs(z))).toBeLessThanOrEqual(half);
      expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(5);
      farthest = Math.max(farthest, Math.abs(x), Math.abs(z));
    }
    expect(farthest).toBeGreaterThan(half * 0.8);
  });

  it.each(BIG_MAPS)('let the player walk to the wall of the $id and no further', ({ half }) => {
    const body = { x: 0, z: 0, vx: 0, vz: 0, radius: BLUE.radius };
    for (let i = 0; i < 60 * 40; i++) stepPlayer(body, 1, 0, BLUE.speed, 1 / 60, 1, half);
    expect(body.x).toBeCloseTo(half - BLUE.radius * 0.8);
    expect(body.x).toBeGreaterThan(ARENA);
  });

  it.each(BIG_MAPS)('rebound bots off the wall of the $id, not the old one', ({ half }) => {
    const bot = { x: ARENA + 1, z: 0, vx: 3, vz: 0, radius: BLUE.radius, speed: 3, tx: half + 10, tz: 0 };
    stepBot(bot, 1, 0, 0.02, 1, half);
    expect(bot.x).toBeGreaterThan(ARENA + 1);
    bot.x = half;
    bot.vx = 3;
    stepBot(bot, 1, 0, 0.02, 1, half);
    expect(bot.vx).toBeLessThan(0);
    expect(bot.x).toBeLessThanOrEqual(half - BLUE.radius * 0.8);
  });

  it.each(BIG_MAPS)('let bots wander in the far parts of the $id', ({ half }) => {
    const far = { stage: 0, x: half - 8, z: -(half - 8) };
    const target = wanderTarget(far, () => 0.5, half);
    expect(target).toEqual({ x: half - 8, z: -(half - 8) });
    for (const r of [0, 1]) {
      const edge = wanderTarget({ stage: 0, x: half, z: -half }, () => r, half);
      expect(Math.max(Math.abs(edge.x), Math.abs(edge.z))).toBeLessThanOrEqual(half - 2);
    }
  });
});

describe('obstacles fit the chosen map', () => {
  it.each(BIG_MAPS)('scatter trees and puddles across the $id with the same guarantees', ({ half }) => {
    let beyondOldArena = 0;
    for (let seed = 0; seed < 300; seed++) {
      const layout = planHarmlessObstacles(HARMLESS_MAX, seeded(seed), half);
      expect(layout).toHaveLength(HARMLESS_MAX);
      layout.forEach((a, i) => {
        expect(Math.max(Math.abs(a.x), Math.abs(a.z)) + a.radius).toBeLessThanOrEqual(half - HARMLESS_WALL_MARGIN + 1e-9);
        expect(Math.hypot(a.x, a.z) - a.radius).toBeGreaterThanOrEqual(HARMLESS_START_CLEARANCE - 1e-9);
        for (const b of layout.slice(i + 1)) {
          expect(Math.hypot(a.x - b.x, a.z - b.z) - a.radius - b.radius).toBeGreaterThanOrEqual(HARMLESS_GAP - 1e-9);
        }
        if (Math.max(Math.abs(a.x), Math.abs(a.z)) > ARENA) beyondOldArena++;
      });
    }
    expect(beyondOldArena).toBeGreaterThan(100);
  });

  it.each(BIG_MAPS)('open hazards near the player anywhere on the $id, inside its walls', ({ half }) => {
    const player = { x: half - 2, z: -(half - 2), radius: BLUE.radius };
    let spawned = 0;
    let beyondOldArena = 0;
    for (let seed = 0; seed < 30; seed++) {
      const random = seeded(seed);
      const field = createHazardField(random, half);
      const known = new Set<number>();
      for (let frame = 0; frame < 60 * 30; frame++) {
        stepHazardField(field, 1 / 30, player, [], random);
        for (const hazard of field.hazards) {
          expect(Math.max(Math.abs(hazard.x), Math.abs(hazard.z)) + hazard.radius).toBeLessThanOrEqual(half + 1e-9);
          if (known.has(hazard.id)) continue;
          known.add(hazard.id);
          spawned++;
          const centre = Math.hypot(hazard.x - player.x, hazard.z - player.z);
          expect(centre).toBeLessThanOrEqual(HAZARD_SPAWN_RANGE + 1e-9);
          expect(centre - hazard.radius - player.radius).toBeGreaterThanOrEqual(HAZARD_PLAYER_CLEARANCE - 1e-9);
          if (Math.max(Math.abs(hazard.x), Math.abs(hazard.z)) > ARENA) beyondOldArena++;
        }
      }
    }
    expect(spawned).toBeGreaterThan(80);
    expect(beyondOldArena).toBeGreaterThan(spawned / 2);
  });

  it.each(BIG_MAPS)('let a moving hazard roam the $id without crossing its walls', ({ half }) => {
    for (let seed = 0; seed < 40; seed++) {
      const field = createHazardField(seeded(seed), half);
      field.spawnIn = Infinity;
      const hazard = spawnHazard(field, 'tornado', half - 3, half - 3, seeded(seed));
      const random = seeded(seed + 99);
      for (let i = 0; i < 12 * 30; i++) {
        stepHazardField(field, 1 / 30, { x: 0, z: 0, radius: BLUE.radius }, [], random);
        expect(Math.max(Math.abs(hazard.x), Math.abs(hazard.z))).toBeLessThanOrEqual(half - hazard.radius + 1e-9);
      }
      expect(Math.max(Math.abs(hazard.x), Math.abs(hazard.z))).toBeGreaterThan(ARENA - 3);
    }
  });

  it('lays out a new game to the size of the map it is given', () => {
    const field = new BlobObstacleField(new THREE.Scene(), seeded(7));
    let beyondOldArena = 0;
    for (let game = 0; game < 60; game++) {
      field.reset(LARGE.half);
      expect(field.state.arena).toBe(LARGE.half);
      for (const o of field.harmless) {
        expect(Math.max(Math.abs(o.x), Math.abs(o.z))).toBeLessThanOrEqual(LARGE.half);
        if (Math.max(Math.abs(o.x), Math.abs(o.z)) > ARENA) beyondOldArena++;
      }
    }
    expect(beyondOldArena).toBeGreaterThan(20);
    field.reset(SMALL.half);
    expect(field.state.arena).toBe(ARENA);
    field.dispose();
  });
});
