/**
 * Skate Rush 3 — whole runs played by the bot that only knows what is on screen (see
 * `playAsSeen`), with presses allowed every 4 steps (67 ms).
 *
 * Called by: src/games/skate-rush/skateFairness.testkit.ts, skateLevelOrder.test.ts
 */
import { createRun, type BoardId } from './skateRules';
import type { LevelId } from './skateLevels';
import { PHYSICS_DECKS } from './skatePairs.testkit';
import { playAsSeen, type Outcome } from './skateSolver.testkit';

/** Just over four minutes: past top speed and the tightest gaps. */
const STEPS = 15000;
const GRID = 4;

export const SIGHT_RUNS = PHYSICS_DECKS.flatMap((board) => [1, 2, 3, 4, 5, 6].map((seed) => ({ board, seed })));

export function survivesOnSight(level: LevelId, board: BoardId, seed: number, reaction: number): Outcome {
  return playAsSeen(createRun(board, level), { state: seed }, {
    grid: GRID,
    offset: seed % GRID,
    reaction,
    budget: 40000,
    done: (run) => run.frame >= STEPS,
  });
}
