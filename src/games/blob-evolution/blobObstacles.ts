/**
 * Blob Evolution — obstacles, as pure rules (no Three.js, no Phaser).
 *
 * Harmless scenery (trees, puddles) is laid out once, when a game starts. Deadly hazards
 * (black hole, tornado, giant red blob) come and go during play: each shows a warning, then
 * stays deadly for ten seconds.
 *
 * Time only passes through the `dt` handed in, so nothing moves while the game is paused,
 * and the hazard field advances in fixed steps, so it plays the same at any frame rate.
 * The field and the blobs are updated in place: this runs every frame and must not allocate
 * there.
 *
 * Called by: BlobEvolutionScene.ts, blobObstacleField.ts, blobObstacleArt.ts
 * Tested by: blobObstacles.test.ts
 */
import { ARENA, approach, type MovingBody } from './blobRules';

export interface Spot {
  x: number;
  z: number;
}

export interface Body extends Spot {
  radius: number;
}

type Random = () => number;

const EPSILON = 1e-9;

// ---------------------------------------------------------------- harmless scenery

export type HarmlessKind = 'tree' | 'puddle';

export interface HarmlessObstacle extends Body {
  kind: HarmlessKind;
  /** Solid radius of a tree, wet radius of a puddle. */
  radius: number;
}

/** A new game has between none and this many trees and puddles. */
export const HARMLESS_MAX = 5;
export const HARMLESS_SIZE: Record<HarmlessKind, { min: number; max: number }> = {
  tree: { min: 1.3, max: 1.7 },
  puddle: { min: 2.4, max: 3.4 },
};
/** Open ground between the player's start point and the nearest edge of any scenery. */
export const HARMLESS_START_CLEARANCE = 5;
/** Smallest gap between two pieces of scenery: wide enough for the biggest blob. */
export const HARMLESS_GAP = 3;
/** Open ground between scenery and the arena wall, so nothing gets wedged there. */
export const HARMLESS_WALL_MARGIN = 3;

/** Share of its normal pace a blob keeps while its centre is in a puddle. */
export const PUDDLE_SPEED_FACTOR = 0.5;
/** Share of a blob's radius that counts when it touches a tree. */
export const TREE_CONTACT = 0.85;
/** Share of the speed into a tree that comes back out. */
export const TREE_BOUNCE = 0.8;
/** The gentlest rebound off a tree, in units per second, so even a nudge visibly bounces. */
export const TREE_MIN_KICK = 2.5;

/** How many trees and puddles this game gets: 0 to `HARMLESS_MAX`, all equally likely. */
export function pickHarmlessCount(random: Random = Math.random): number {
  return Math.min(HARMLESS_MAX, Math.floor(random() * (HARMLESS_MAX + 1)));
}

function fitsAmong(x: number, z: number, radius: number, layout: readonly HarmlessObstacle[]): boolean {
  if (Math.hypot(x, z) - radius < HARMLESS_START_CLEARANCE) return false;
  return layout.every((o) => Math.hypot(o.x - x, o.z - z) - o.radius - radius >= HARMLESS_GAP);
}

/** A random place for a new piece of scenery; fixed rings are the fallback if luck runs out. */
function harmlessSpot(radius: number, layout: readonly HarmlessObstacle[], random: Random, arena: number): Spot {
  const lim = arena - HARMLESS_WALL_MARGIN - radius;
  for (let tries = 0; tries < 60; tries++) {
    const x = (random() * 2 - 1) * lim;
    const z = (random() * 2 - 1) * lim;
    if (fitsAmong(x, z, radius, layout)) return { x, z };
  }
  // Two rings with far more places than scenery, so one of them is always free.
  for (const ring of [{ distance: 14, places: 12 }, { distance: 25, places: 16 }]) {
    for (let i = 0; i < ring.places; i++) {
      const angle = (i / ring.places) * Math.PI * 2;
      const x = Math.cos(angle) * ring.distance;
      const z = Math.sin(angle) * ring.distance;
      if (fitsAmong(x, z, radius, layout)) return { x, z };
    }
  }
  throw new Error('No room left for harmless obstacles');
}

/**
 * Lay out `count` trees and puddles in a random mix over a map of half-width `arena`. None sits
 * on the start point, against the wall or too close to another.
 */
export function planHarmlessObstacles(count: number, random: Random = Math.random, arena: number = ARENA): HarmlessObstacle[] {
  const layout: HarmlessObstacle[] = [];
  const wanted = Math.min(HARMLESS_MAX, Math.max(0, Math.floor(count)));
  for (let i = 0; i < wanted; i++) {
    const kind: HarmlessKind = random() < 0.5 ? 'tree' : 'puddle';
    const { min, max } = HARMLESS_SIZE[kind];
    const radius = min + random() * (max - min);
    const { x, z } = harmlessSpot(radius, layout, random, arena);
    layout.push({ kind, x, z, radius });
  }
  return layout;
}

/** The ground a blob covers is scaled by this: less than 1 only while it is in a puddle. */
export function puddleSpeedFactor(x: number, z: number, harmless: readonly HarmlessObstacle[]): number {
  for (let i = 0; i < harmless.length; i++) {
    const o = harmless[i];
    if (o.kind === 'puddle' && Math.hypot(x - o.x, z - o.z) < o.radius) return PUDDLE_SPEED_FACTOR;
  }
  return 1;
}

/** How near a blob's centre can come to a tree's before they touch. */
export function treeContactDistance(tree: HarmlessObstacle, blobRadius: number): number {
  return tree.radius + blobRadius * TREE_CONTACT;
}

/**
 * Trees are solid: put an overlapping blob back on the surface and turn the speed it had into
 * the trunk back outward. Returns true if it bounced.
 */
export function bounceOffTrees(body: MovingBody, harmless: readonly HarmlessObstacle[]): boolean {
  let bounced = false;
  for (let i = 0; i < harmless.length; i++) {
    const o = harmless[i];
    if (o.kind !== 'tree') continue;
    let nx = body.x - o.x;
    let nz = body.z - o.z;
    const distance = Math.hypot(nx, nz);
    const reach = treeContactDistance(o, body.radius);
    if (distance >= reach) continue;

    if (distance > EPSILON) {
      nx /= distance;
      nz /= distance;
    } else {
      // Dead centre: send it back the way it came.
      const speed = Math.hypot(body.vx, body.vz);
      nx = speed > EPSILON ? -body.vx / speed : 1;
      nz = speed > EPSILON ? -body.vz / speed : 0;
    }
    body.x = o.x + nx * reach;
    body.z = o.z + nz * reach;

    const along = body.vx * nx + body.vz * nz;
    if (along < 0) {
      const away = Math.max(TREE_MIN_KICK, -along * TREE_BOUNCE);
      body.vx += (away - along) * nx;
      body.vz += (away - along) * nz;
      bounced = true;
    }
  }
  return bounced;
}

// ---------------------------------------------------------------- deadly hazards

export const HAZARD_KINDS = ['blackHole', 'tornado', 'redBlob'] as const;
export type HazardKind = (typeof HAZARD_KINDS)[number];

export interface Hazard extends Body {
  id: number;
  kind: HazardKind;
  /** `warning` is only a marker on the ground; `active` is deadly. */
  phase: 'warning' | 'active';
  /** Seconds of play spent in the current phase. */
  age: number;
  /** Size of the deadly part. */
  radius: number;
  vx: number;
  vz: number;
  /** The direction a moving hazard is making for, in radians. */
  heading: number;
  /** Seconds until it picks a new direction. */
  turnIn: number;
}

export interface HazardField {
  hazards: Hazard[];
  /** Half the width of the map they live on. */
  arena: number;
  /** Seconds of play until the next one. Only counts down while there is room for it. */
  spawnIn: number;
  nextId: number;
  /** Play time handed in that has not filled a whole fixed step yet. */
  carry: number;
}

/**
 * Per kind: the deadly radius, the top speed in units per second, and how often it changes
 * direction (`turnMin` + random × `turnSpread` seconds). The tornado is slower than the Blue
 * blob a player starts as, and the red blob slower than any blob, so both can be outrun.
 */
export const HAZARD_SPECS: Record<HazardKind, { radius: number; speed: number; turnMin: number; turnSpread: number }> = {
  blackHole: { radius: 1.3, speed: 0, turnMin: 0, turnSpread: 0 },
  tornado: { radius: 1.4, speed: 2.6, turnMin: 0.7, turnSpread: 1.1 },
  redBlob: { radius: 3, speed: 1.5, turnMin: 2, turnSpread: 2 },
};

/** The marker shows for this long before a hazard turns deadly. Not part of its lifetime. */
export const HAZARD_WARNING_SECONDS = 2;
/** How long a hazard stays deadly, in seconds of play. */
export const HAZARD_LIFETIME_SECONDS = 10;
/** Most hazards at once, warnings included. */
export const HAZARD_MAX_ACTIVE = 2;
/** The first one comes after MIN + random × SPREAD seconds. */
export const HAZARD_FIRST_SPAWN_MIN = 6;
export const HAZARD_FIRST_SPAWN_SPREAD = 3;
/** Then one every MIN + random × SPREAD seconds, counted while there is room for it. */
export const HAZARD_INTERVAL_MIN = 5;
export const HAZARD_INTERVAL_SPREAD = 5;
/** How soon to try again when no fair place was found. */
const HAZARD_RETRY_SECONDS = 0.5;
/** Open ground between the player and a new hazard's deadly edge. */
export const HAZARD_PLAYER_CLEARANCE = 7;
/** New hazards open within this distance of the player, so they are seen and matter. */
export const HAZARD_SPAWN_RANGE = 18;
/** Share of a blob's radius that counts when it touches a hazard (a little forgiving). */
export const HAZARD_CONTACT = 0.5;

/** A black hole drags in anything closer than this, harder the closer it is. */
export const BLACK_HOLE_PULL_RADIUS = 9;
/** The drag at the core, in units per second: more than the fastest evolving blob can run. */
export const BLACK_HOLE_PULL_MAX = 6.5;

/** The fixed step of the hazard simulation, in seconds. */
const HAZARD_STEP = 1 / 120;
/** How quickly a moving hazard swings round to its new direction (per second). */
const HAZARD_STEER_RESPONSE = 3;
/** The widest change of direction, in radians (135° either way). */
const HAZARD_TURN_ARC = Math.PI * 1.5;

export function createHazardField(random: Random = Math.random, arena: number = ARENA): HazardField {
  return {
    hazards: [],
    arena,
    spawnIn: HAZARD_FIRST_SPAWN_MIN + random() * HAZARD_FIRST_SPAWN_SPREAD,
    nextId: 1,
    carry: 0,
  };
}

/** Open a hazard at a spot, starting with its warning. */
export function spawnHazard(field: HazardField, kind: HazardKind, x: number, z: number, random: Random = Math.random): Hazard {
  const spec = HAZARD_SPECS[kind];
  const hazard: Hazard = {
    id: field.nextId++,
    kind,
    phase: 'warning',
    age: 0,
    x,
    z,
    radius: spec.radius,
    vx: 0,
    vz: 0,
    heading: random() * Math.PI * 2,
    turnIn: spec.turnMin + random() * spec.turnSpread,
  };
  field.hazards.push(hazard);
  return hazard;
}

/** The nearest to the player, centre to centre, that a hazard of this kind may open. */
function minSpawnDistance(kind: HazardKind, playerRadius: number): number {
  const reach = HAZARD_SPECS[kind].radius + playerRadius + HAZARD_PLAYER_CLEARANCE;
  // A black hole must not already be dragging the player when it opens.
  return kind === 'blackHole' ? Math.max(reach, BLACK_HOLE_PULL_RADIUS + playerRadius) : reach;
}

/** A fair random place for a new hazard, or null if none turned up. */
function hazardSpot(
  kind: HazardKind,
  player: Body,
  field: HazardField,
  harmless: readonly HarmlessObstacle[],
  random: Random,
): Spot | null {
  const { radius } = HAZARD_SPECS[kind];
  const near = minSpawnDistance(kind, player.radius);
  const lim = field.arena - radius;
  for (let tries = 0; tries < 40; tries++) {
    const angle = random() * Math.PI * 2;
    const distance = near + random() * Math.max(0, HAZARD_SPAWN_RANGE - near);
    const x = player.x + Math.cos(angle) * distance;
    const z = player.z + Math.sin(angle) * distance;
    // Rejected, not clamped: clamping could drag the spot back next to the player.
    if (Math.abs(x) > lim || Math.abs(z) > lim) continue;
    if (field.hazards.some((h) => Math.hypot(h.x - x, h.z - z) < h.radius + radius + 2)) continue;
    // A black hole on a tree or puddle would hide one inside the other.
    if (kind === 'blackHole' && harmless.some((o) => Math.hypot(o.x - x, o.z - z) < o.radius + radius + 1)) continue;
    return { x, z };
  }
  return null;
}

function trySpawn(field: HazardField, player: Body, harmless: readonly HarmlessObstacle[], random: Random): void {
  // One of each kind at a time, so two on screen are always different.
  const free = HAZARD_KINDS.filter((kind) => !field.hazards.some((h) => h.kind === kind));
  const kind = free[Math.min(free.length - 1, Math.floor(random() * free.length))];
  const spot = hazardSpot(kind, player, field, harmless, random);
  if (!spot) {
    field.spawnIn = HAZARD_RETRY_SECONDS;
    return;
  }
  spawnHazard(field, kind, spot.x, spot.z, random);
  field.spawnIn = HAZARD_INTERVAL_MIN + random() * HAZARD_INTERVAL_SPREAD;
}

/** Wander: ease toward the chosen direction, change it now and then, and rebound off the wall. */
function wander(hazard: Hazard, h: number, random: Random, arena: number): void {
  const spec = HAZARD_SPECS[hazard.kind];
  if (spec.speed === 0) return;

  hazard.turnIn -= h;
  if (hazard.turnIn <= 0) {
    hazard.heading += (random() - 0.5) * HAZARD_TURN_ARC;
    hazard.turnIn = spec.turnMin + random() * spec.turnSpread;
  }
  hazard.vx = approach(hazard.vx, Math.cos(hazard.heading) * spec.speed, h, HAZARD_STEER_RESPONSE);
  hazard.vz = approach(hazard.vz, Math.sin(hazard.heading) * spec.speed, h, HAZARD_STEER_RESPONSE);
  hazard.x += hazard.vx * h;
  hazard.z += hazard.vz * h;

  const lim = arena - hazard.radius;
  if (Math.abs(hazard.x) > lim) {
    hazard.x = Math.sign(hazard.x) * lim;
    hazard.vx = -hazard.vx;
    hazard.heading = Math.PI - hazard.heading;
  }
  if (Math.abs(hazard.z) > lim) {
    hazard.z = Math.sign(hazard.z) * lim;
    hazard.vz = -hazard.vz;
    hazard.heading = -hazard.heading;
  }
}

function tick(field: HazardField, h: number, player: Body, harmless: readonly HarmlessObstacle[], random: Random): void {
  const { hazards } = field;
  for (let i = hazards.length - 1; i >= 0; i--) {
    const hazard = hazards[i];
    hazard.age += h;
    if (hazard.phase === 'warning') {
      if (hazard.age >= HAZARD_WARNING_SECONDS - EPSILON) {
        hazard.phase = 'active';
        hazard.age = 0;
      }
    } else if (hazard.age >= HAZARD_LIFETIME_SECONDS - EPSILON) {
      hazards.splice(i, 1);
    } else {
      wander(hazard, h, random, field.arena);
    }
  }

  if (hazards.length >= HAZARD_MAX_ACTIVE) return;
  field.spawnIn -= h;
  if (field.spawnIn <= EPSILON) trySpawn(field, player, harmless, random);
}

/** Let `dt` seconds of play pass: warnings turn deadly, hazards move, expire and appear. */
export function stepHazardField(
  field: HazardField,
  dt: number,
  player: Body,
  harmless: readonly HarmlessObstacle[],
  random: Random = Math.random,
): void {
  if (!Number.isFinite(dt) || dt <= 0) return;
  field.carry += dt;
  while (field.carry >= HAZARD_STEP - EPSILON) {
    field.carry -= HAZARD_STEP;
    tick(field, HAZARD_STEP, player, harmless, random);
  }
}

/** The black hole's drag at a distance from its centre, in units per second. */
export function suctionSpeed(distance: number): number {
  if (distance >= BLACK_HOLE_PULL_RADIUS) return 0;
  const core = HAZARD_SPECS.blackHole.radius;
  if (distance <= core) return BLACK_HOLE_PULL_MAX;
  const closeness = (BLACK_HOLE_PULL_RADIUS - distance) / (BLACK_HOLE_PULL_RADIUS - core);
  return BLACK_HOLE_PULL_MAX * closeness * closeness;
}

/** Drag a blob toward every active black hole for `dt` seconds, never past its centre. */
export function applySuction(body: Spot, hazards: readonly Hazard[], dt: number): void {
  if (!Number.isFinite(dt) || dt <= 0) return;
  for (let i = 0; i < hazards.length; i++) {
    const hole = hazards[i];
    if (hole.kind !== 'blackHole' || hole.phase !== 'active') continue;
    // Small steps: the drag changes quickly near the core.
    const steps = Math.max(1, Math.ceil(dt / HAZARD_STEP - EPSILON));
    for (let s = 0; s < steps; s++) {
      const dx = hole.x - body.x;
      const dz = hole.z - body.z;
      const distance = Math.hypot(dx, dz);
      const move = Math.min(distance, suctionSpeed(distance) * (dt / steps));
      if (move <= 0) break;
      body.x += (dx / distance) * move;
      body.z += (dz / distance) * move;
    }
  }
}

/** The active hazard this blob is touching, or null. A warning never counts. */
export function deadlyHazardFor(body: Body, hazards: readonly Hazard[]): Hazard | null {
  for (let i = 0; i < hazards.length; i++) {
    const hazard = hazards[i];
    if (hazard.phase !== 'active') continue;
    if (Math.hypot(body.x - hazard.x, body.z - hazard.z) < hazard.radius + body.radius * HAZARD_CONTACT) return hazard;
  }
  return null;
}

/**
 * A hazard may take a bot only while others remain. Bots eating each other always leaves the
 * eater, so this keeps it true that only the player can empty the arena and become the Angel.
 */
export function hazardMayTake(aliveBots: number): boolean {
  return aliveBots > 1;
}

// ---------------------------------------------------------------- bot steering

/** Bots start dodging when a hazard's deadly edge is this close to their own edge. */
const BOT_HAZARD_BERTH = 3.5;
/** Bots keep at least this far from a black hole's centre, where they can still outrun it. */
const BOT_BLACK_HOLE_BERTH = 6.75;
/** How sharply fear rises inside the berth: full panic from 60% of the way out. */
const BOT_FEAR = 2.5;
/** Bots start turning to go round a tree this far before they would touch it. */
const BOT_TREE_LOOKAHEAD = 1.5;

/**
 * Turn the way a bot wants to go (a unit vector, or zero) into the way it should go: away
 * from nearby hazards, warnings included, and around trees. Writes into `out`.
 */
export function steerAroundObstacles(
  body: Body,
  wantX: number,
  wantZ: number,
  hazards: readonly Hazard[],
  harmless: readonly HarmlessObstacle[],
  out: Spot,
): void {
  let x = wantX;
  let z = wantZ;
  let changed = false;

  let fleeX = 0;
  let fleeZ = 0;
  let fear = 0;
  for (let i = 0; i < hazards.length; i++) {
    const hazard = hazards[i];
    const dx = body.x - hazard.x;
    const dz = body.z - hazard.z;
    const distance = Math.hypot(dx, dz);
    const berth = hazard.kind === 'blackHole' ? BOT_BLACK_HOLE_BERTH : hazard.radius + body.radius + BOT_HAZARD_BERTH;
    if (distance >= berth) continue;
    const weight = Math.min(1, ((berth - distance) / berth) * BOT_FEAR);
    fleeX += (distance > EPSILON ? dx / distance : 1) * weight;
    fleeZ += (distance > EPSILON ? dz / distance : 0) * weight;
    fear = Math.max(fear, weight);
  }
  if (fear > 0) {
    const length = Math.hypot(fleeX, fleeZ) || 1;
    x = x * (1 - fear) + (fleeX / length) * fear;
    z = z * (1 - fear) + (fleeZ / length) * fear;
    changed = true;
  }

  for (let i = 0; i < harmless.length; i++) {
    const o = harmless[i];
    if (o.kind !== 'tree') continue;
    const dx = o.x - body.x;
    const dz = o.z - body.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= EPSILON || distance >= treeContactDistance(o, body.radius) + BOT_TREE_LOOKAHEAD) continue;
    const ux = dx / distance;
    const uz = dz / distance;
    const into = x * ux + z * uz;
    if (into <= 0) continue;
    // Swap the part heading into the trunk for a sideways one, on the side already favoured.
    const side = z * ux - x * uz >= 0 ? 1 : -1;
    x += (-uz * side - ux) * into;
    z += (ux * side - uz) * into;
    changed = true;
  }

  if (changed) {
    const length = Math.hypot(x, z);
    x = length > EPSILON ? x / length : 0;
    z = length > EPSILON ? z / length : 0;
  }
  out.x = x;
  out.z = z;
}
