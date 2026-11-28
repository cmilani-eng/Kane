/**
 * Skate Rush 3 — two patterns back to back, as close together as a level can ever send them.
 * Whole runs only sample the sequences the dice happen to give; this tries every pair.
 *
 * Called by: src/games/skate-rush/skateFairness.testkit.ts, skateSight.testkit.ts, skateCourses.test.ts
 */
import { BOARD_IDS, createRun, cruiseSpeed, spawnPattern, type BoardId, type Spawnable } from './skateRules';
import { LEVELS, type LevelId } from './skateLevels';
import { allBehind, findWayThrough, roll, type Outcome } from './skateSolver.testkit';

/** The Magnet Deck jumps and rolls like the Starter Deck, so hazards are the same on both. */
export const PHYSICS_DECKS: readonly BoardId[] = BOARD_IDS.filter((b) => b !== 'magnet');

/**
 * The speeds at which gaps are at their tightest: at the start, when they have only begun to
 * close (`loose`), and from score 900 (step 7500) on.
 */
export const PAIR_SPEEDS = [
  { name: 'at the start', frame: 0, turbo: 0, loose: true },
  { name: 'once gaps are tightest', frame: 7500, turbo: 0, loose: false },
  { name: 'at top speed', frame: 100000, turbo: 0, loose: false },
  { name: 'at top speed with Turbo', frame: 100000, turbo: 100000, loose: false },
] as const;
export type PairSpeed = (typeof PAIR_SPEEDS)[number];

/** Whether there is a way through `first`, then `second` after the shortest wait the level allows. */
export function passPair(
  level: LevelId,
  board: BoardId,
  speed: PairSpeed,
  [first, second]: readonly [Spawnable, Spawnable],
  seed: number,
  grid: number,
  offset: number,
): Outcome {
  const start = createRun(board, level);
  start.frame = speed.frame;
  start.turbo = speed.turbo;
  start.spawn = 1e9;
  const dice = roll({ state: seed });
  const { tail, rest } = spawnPattern(start, first, dice);
  const gap = (speed.loose ? LEVELS[level].gapEasy : LEVELS[level].gapHard)[0];
  const secondAt = start.frame + Math.ceil(gap + tail / cruiseSpeed(start) + rest);
  return findWayThrough(start, { state: seed }, {
    grid,
    offset,
    budget: 40000,
    // The second pattern's own dice depend only on the seed, so every attempt meets the same one.
    beforeStep: (run) => {
      if (run.frame + 1 === secondAt) spawnPattern(run, second, roll({ state: seed + 77 }));
    },
    done: (run) => run.frame >= secondAt && allBehind(run),
  });
}
