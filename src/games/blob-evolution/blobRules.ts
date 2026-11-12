/**
 * Blob Evolution — pure gameplay rules (no Three.js, no Phaser).
 * Ported from the original standalone game (games/blob-evolution/main.js) so the
 * pacing is identical: velocities are units per second, steering is smoothed with
 * a frame-rate independent factor, and bots only hunt what they can actually eat.
 *
 * Called by: src/games/blob-evolution/BlobEvolutionScene.ts
 * Tested by: src/games/blob-evolution/blobRules.test.ts
 */

/** The evolution chain. `radius` is the collision size, `speed` the top speed in units per second. */
export const STAGES = [
  { name: 'Purple', color: 0x8b4fd4, radius: 0.42, speed: 2.35 },
  { name: 'Blue', color: 0x1e8ef0, radius: 0.58, speed: 3.05 },
  { name: 'Green', color: 0x2fbf6e, radius: 0.77, speed: 3.85 },
  { name: 'Rock', color: 0x9a9386, radius: 0.98, speed: 4.55 },
  { name: 'Rainbow', color: 0xffffff, radius: 1.18, speed: 5.35 },
  { name: 'Angel', color: 0xfff0a8, radius: 1.35, speed: 5.9 },
] as const;

/** The last stage; reached by winning, never by eating. */
export const ANGEL_STAGE = 5;

export const ARENA = 34;
export const BOT_COUNT = 42;

/** The player begins as a Blue blob (stage 1) and can eat the Purple ones. */
export const PLAYER_START_STAGE = 1;
export const RAINBOW_STAGE = 4;

/** How quickly the player's velocity follows the input (per second). */
export const PLAYER_RESPONSE = 7;
/** Bots steer much more lazily than the player (per second). */
export const BOT_RESPONSE = 2.4;
/** A bot only notices prey (or the player, when it can eat them) inside this range. */
export const BOT_CHASE_RANGE = 13;
/** Seconds between a bot re-deciding where to go: MIN + random * SPREAD. */
export const BOT_THINK_MIN = 0.25;
export const BOT_THINK_SPREAD = 0.45;
/** Chance that a bot with nothing to chase picks a new wander target when it thinks. */
export const BOT_WANDER_CHANCE = 0.72;
export const BOT_WANDER_RANGE = 15;

export interface Mover {
  stage: number;
  x: number;
  z: number;
}

/**
 * Who eats whom: a blob eats the stage directly below it. Rainbow eats every lower
 * stage. Nothing eats upward, and Purple (stage 0) eats nothing.
 */
export function canEat(predatorStage: number, preyStage: number): boolean {
  if (predatorStage === RAINBOW_STAGE) return preyStage < RAINBOW_STAGE;
  return predatorStage > 0 && preyStage === predatorStage - 1;
}

/** Move `current` toward `target`, covering a fraction that does not depend on frame rate. */
export function approach(current: number, target: number, dt: number, response: number): number {
  return current + (target - current) * Math.min(1, dt * response);
}

/** Half the bots are Purple, the other half Blue, in random order. */
export function botStagePlan(count: number, random: () => number = Math.random): number[] {
  const purple = Math.floor(count / 2);
  const stages = [...Array<number>(purple).fill(0), ...Array<number>(count - purple).fill(1)];
  // Fisher–Yates, so the shuffle is unbiased and uses the injected random source.
  for (let i = stages.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [stages[i], stages[j]] = [stages[j], stages[i]];
  }
  return stages;
}

/** A random spot in the arena that is at least `clear` units from the centre (the player). */
export function spawnPoint(random: () => number = Math.random, clear = 5): { x: number; z: number } {
  for (let tries = 0; tries < 50; tries++) {
    const x = (random() - 0.5) * ARENA * 1.75;
    const z = (random() - 0.5) * ARENA * 1.75;
    if (Math.hypot(x, z) >= clear) return { x, z };
  }
  return { x: clear, z: 0 };
}

/**
 * The nearest thing this bot wants to chase and is close enough to notice.
 * The player only counts when the bot can eat them; bots also hunt prey, and
 * Rainbow bots hunt each other. Returns null when nothing is in range.
 */
export function findChaseTarget(
  bot: Mover,
  player: Mover | null,
  others: readonly (Mover & { alive: boolean })[],
  range = BOT_CHASE_RANGE,
): { x: number; z: number } | null {
  let best = Infinity;
  let target: { x: number; z: number } | null = null;

  if (player && canEat(bot.stage, player.stage)) {
    best = Math.hypot(player.x - bot.x, player.z - bot.z);
    target = player;
  }
  for (const other of others) {
    if (other === bot || !other.alive) continue;
    const wants = canEat(bot.stage, other.stage) || (bot.stage === RAINBOW_STAGE && other.stage === RAINBOW_STAGE);
    if (!wants) continue;
    const d = Math.hypot(other.x - bot.x, other.z - bot.z);
    if (d < best) {
      best = d;
      target = other;
    }
  }
  return target && best < range ? { x: target.x, z: target.z } : null;
}

/** A nearby wander point, kept two units inside the arena wall. */
export function wanderTarget(bot: Mover, random: () => number = Math.random): { x: number; z: number } {
  const lim = ARENA - 2;
  const clamp = (v: number) => Math.min(lim, Math.max(-lim, v));
  return {
    x: clamp(bot.x + (random() - 0.5) * BOT_WANDER_RANGE),
    z: clamp(bot.z + (random() - 0.5) * BOT_WANDER_RANGE),
  };
}

export const RPS_CHOICES = ['rock', 'paper', 'scissors'] as const;
export type RpsChoice = (typeof RPS_CHOICES)[number];

const BEATS: Record<RpsChoice, RpsChoice> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

/** Result of a rock-paper-scissors round from the player's side. */
export function rpsOutcome(player: RpsChoice, opponent: RpsChoice): 'win' | 'lose' | 'tie' {
  if (player === opponent) return 'tie';
  return BEATS[player] === opponent ? 'win' : 'lose';
}
