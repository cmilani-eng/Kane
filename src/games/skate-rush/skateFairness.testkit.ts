/**
 * Skate Rush 3 — fairness, proved by playing, for one difficulty level.
 *  1. Under every low ceiling, on every deck, at the slowest and fastest speeds: one jump gets
 *     through, and no second jump does.
 *  2. Every pattern, and every timing course the level sends, has a way through on its own that
 *     does not need frame-perfect presses.
 *  3. Whole seeded runs, where patterns follow each other as in the game, can be survived.
 *  4. Every pair of those has a way through, as close together as the level can send them.
 *  5. There is always some time between one spawn's hazards and the next one's.
 *  6. The bot above knows what is coming before it appears, which no person does. A second bot
 *     plans only around what is on screen, a reaction time after it appears, and survives too.
 *  7. Nothing arrives before it, or the boss holding it, has been on screen long enough to see.
 *
 * Called by: src/games/skate-rush/skateFairness.{easy,medium,hard,extreme}.test.ts
 */
import { describe, expect, it } from 'vitest';
import {
  BOARD_IDS,
  PATTERNS,
  SKATER_X,
  UNDER,
  VIEW_W,
  createRun,
  hazardBox,
  isCeiling,
  spawnPattern,
  stepRun,
  type BoardId,
  type Item,
  type Run,
  type Spawnable,
  type UnderPattern,
} from './skateRules';
import { COURSE_IDS } from './skateCourses';
import { LEVELS, type LevelId } from './skateLevels';
import { advance, allBehind, copyRun, findWayThrough, hazardVisits, roll, type Dice } from './skateSolver.testkit';
import { PAIR_SPEEDS, PHYSICS_DECKS, passPair } from './skatePairs.testkit';
import { SIGHT_RUNS, survivesOnSight } from './skateSight.testkit';

/** What this level has to allow for. All times are in 60 Hz steps. */
export interface Fairness {
  /** The bot may press only every `grid` steps, wherever the grid starts: its slack for a human. */
  grid: number;
  /** Least time from one spawn's hazards leaving the skater to the next one's arriving. */
  breathing: number;
  /** Least time anything, or the boss holding it, is on screen before it can hit. */
  warning: number;
  /** The reaction time with which the on-screen bot survives every run. */
  reaction: number;
}

/** Frames that give a level's starting speed and its top speed. */
const SPEEDS = [
  { name: 'slowest', frame: 0, turbo: 0 },
  { name: 'slowest with Turbo', frame: 0, turbo: 100000 },
  { name: 'fastest', frame: 100000, turbo: 0 },
  { name: 'fastest with Turbo', frame: 100000, turbo: 100000 },
] as const;
type Speed = (typeof SPEEDS)[number];

/** A run on which only the asked-for pattern ever appears. */
function onePattern(level: LevelId, board: BoardId, speed: Speed, pattern: Spawnable, seed: number): Run {
  const run = createRun(board, level);
  run.frame = speed.frame;
  run.turbo = speed.turbo;
  run.spawn = 1e9;
  spawnPattern(run, pattern, roll({ state: seed }));
  return run;
}

// ---------------------------------------------------------------- 1. low ceilings

interface CeilingResult {
  /** The longest run of consecutive steps at which one jump alone gets through. */
  singleWindow: number;
  secondJumpsTried: number;
  /** Second jumps that got a skater through who had not yet cleared the hazard underneath. */
  cheats: string[];
}

/** Whether the hazard on the ground is completely behind the skater's hitbox. */
function groundCleared(run: Run, ground: Item): boolean {
  const box = ground.type === 'pit' ? { x: ground.x + 8, w: ground.w - 16 } : hazardBox(ground, run.frame);
  return box.x + box.w <= SKATER_X + 9;
}

/** Whether the skater is still alive once everything has gone by. */
function survives(run: Run, dice: Dice): boolean {
  while (!run.over && !allBehind(run)) advance(run, dice, false);
  return !run.over;
}

/** Try every moment for a first jump, and after each one every moment for a second. */
function tryEveryJump(start: Run): CeilingResult {
  const dice: Dice = { state: 1 };
  const waiting = copyRun(start);
  const result: CeilingResult = { singleWindow: 0, secondJumpsTried: 0, cheats: [] };
  let streak = 0;

  for (let first = 0; !waiting.over && !allBehind(waiting); first++) {
    const single = copyRun(waiting);
    advance(single, dice, true);
    const airborne = copyRun(single);
    streak = survives(single, dice) ? streak + 1 : 0;
    result.singleWindow = Math.max(result.singleWindow, streak);

    // Every step of that first airtime is a chance for a second jump.
    for (let after = 1; !airborne.over && airborne.player.jumps === 1; after++) {
      const ground = airborne.items.find((o) => !isCeiling(o.type) && o.type !== 'coin' && o.type !== 'power');
      const alreadyCleared = !ground || groundCleared(airborne, ground);
      const double = copyRun(airborne);
      advance(double, dice, true);
      // `jumps` goes back to 0, or to a fresh 1, only if the skater had already landed.
      const wasSecondJump = double.player.jumps === 2;
      if (wasSecondJump) {
        result.secondJumpsTried++;
        if (!alreadyCleared && survives(double, dice)) result.cheats.push(`first at ${first}, second ${after} later`);
      }
      advance(airborne, dice, false);
    }
    advance(waiting, dice, false);
  }
  return result;
}

// ---------------------------------------------------------------- 5. time to see it coming

/** The fewest steps between a hazard (or its thrower) coming on screen and its reaching the skater. */
function shortestWarning(start: Run): { steps: number; type: string } {
  const run = copyRun(start);
  const seen = new Map<Item, number>();
  const reached = new Set<Item>();
  let worst = { steps: Infinity, type: 'nothing' };
  for (let step = 1; step < 600; step++) {
    // The skater is held out of the way: only the hazards' own timing is being measured.
    run.player.y = -2000;
    run.player.vy = 0;
    const stillToThrow = new Map(run.items.map((o) => [o, o.throws?.length ?? 0]));
    stepRun(run, () => 0.5);
    const throwers = run.items.filter((o) => (stillToThrow.get(o) ?? 0) > (o.throws?.length ?? 0));
    for (const o of run.items) {
      if (o.type === 'coin' || o.type === 'power' || isCeiling(o.type)) continue;
      if (!seen.has(o)) {
        const thrower = o.type === 'bomb' ? throwers.shift() : undefined;
        const since = thrower ? seen.get(thrower) : o.x <= VIEW_W ? step : undefined;
        if (since !== undefined) seen.set(o, since);
      }
      if (!reached.has(o) && o.x <= SKATER_X + 46) {
        reached.add(o);
        const warned = step - (seen.get(o) ?? step);
        if (warned < worst.steps) worst = { steps: warned, type: o.type };
      }
    }
  }
  return worst;
}

// ----------------------------------------------------------------

/** Long enough to reach top speed (from step 12350 on every level) and the tightest gaps (score 900). */
const RUN_STEPS = 15000;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function describeFairness(level: LevelId, fair: Fairness): void {
  /** Everything the level can send. */
  const sends: readonly Spawnable[] = LEVELS[level].courses > 0 ? [...PATTERNS, ...COURSE_IDS] : PATTERNS;

  describe(`${level}: under a low ceiling`, () => {
    const cases = (Object.keys(UNDER) as UnderPattern[]).flatMap((pattern) =>
      BOARD_IDS.flatMap((board) => SPEEDS.map((speed) => ({ pattern, board, speed, name: speed.name }))),
    );

    it.each(cases)('$pattern, $board deck, $name: one jump gets through, two never do', ({ pattern, board, speed }) => {
      // Several seeds, for the different widths of spikes and pits.
      for (const seed of [1, 2, 3]) {
        const result = tryEveryJump(onePattern(level, board, speed, pattern, seed));
        // Eight steps is 130 ms to press in.
        expect(result.singleWindow).toBeGreaterThanOrEqual(8);
        expect(result.secondJumpsTried).toBeGreaterThan(500);
        expect(result.cheats).toEqual([]);
      }
    });
  });

  describe(`${level}: every pattern on its own`, () => {
    const cases = sends.flatMap((pattern) => BOARD_IDS.map((board) => ({ pattern, board })));

    it.each(cases)(
      '$pattern can be passed on the $board deck at any speed',
      ({ pattern, board }) => {
        const failures: string[] = [];
        for (const speed of SPEEDS) {
          for (const seed of [1, 2, 3, 4]) {
            for (let offset = 0; offset < fair.grid; offset++) {
              const found = findWayThrough(onePattern(level, board, speed, pattern, seed), { state: seed }, {
                grid: fair.grid,
                offset,
                done: allBehind,
                budget: 40000,
              });
              if (!found.ok) failures.push(`${speed.name}, seed ${seed}, grid offset ${offset}: ${found.blockedBy}`);
            }
          }
        }
        expect(failures).toEqual([]);
      },
      60000,
    );
  });

  describe(`${level}: whole runs`, () => {
    const cases = BOARD_IDS.flatMap((board) => SEEDS.map((seed) => ({ board, seed })));

    it.each(cases)(
      'seed $seed on the $board deck can be survived past top speed',
      ({ board, seed }) => {
        const found = findWayThrough(createRun(board, level), { state: seed }, {
          grid: 4,
          offset: seed % 4,
          done: (run) => run.frame >= RUN_STEPS,
          budget: 600000,
        });
        expect(found.ok, `stuck at step ${found.furthest} with ${found.blockedBy}`).toBe(true);
      },
      60000,
    );

    it('between them, put every kind of hazard in front of the bot', () => {
      const seen = new Set<string>();
      for (const seed of SEEDS) {
        const run = createRun('basic', level);
        const dice: Dice = { state: seed };
        while (run.frame < RUN_STEPS) {
          // Only watching what spawns: items are cleared so that nothing can end the run.
          advance(run, dice, false);
          for (const o of run.items) seen.add(o.type);
          run.items = run.items.filter((o) => (o.throws?.length ?? 0) > 0 && o.x > SKATER_X + 100);
          run.over = false;
        }
      }
      for (const type of ['bomb', 'bridge', 'lasernet', 'maces', 'boss', 'chaser', 'monster', 'roller', 'bird', 'animal', 'robot']) {
        expect(seen, type).toContain(type);
      }
    });
  });

  describe(`${level}: every pair of patterns, as close together as they come`, () => {
    it.each(sends)(
      '%s, then anything, can be passed',
      (first) => {
        const failures: string[] = [];
        for (const second of sends) {
          for (const speed of PAIR_SPEEDS) {
            for (const board of PHYSICS_DECKS) {
              for (let offset = 0; offset < fair.grid; offset++) {
                const found = passPair(level, board, speed, [first, second], 1, fair.grid, offset);
                if (!found.ok) failures.push(`then ${second}, ${board}, ${speed.name}, offset ${offset}: ${found.blockedBy}`);
              }
            }
          }
        }
        expect(failures.slice(0, 8)).toEqual([]);
      },
      120000,
    );
  });

  describe(`${level}: seeing only what is on screen`, () => {
    it.each(SIGHT_RUNS)(
      `seed $seed on the $board deck can be survived reacting in ${fair.reaction} steps`,
      ({ board, seed }) => {
        const result = survivesOnSight(level, board, seed, fair.reaction);
        expect(result.ok, `lost at step ${result.furthest} with ${result.blockedBy}`).toBe(true);
      },
      60000,
    );
  });

  describe(`${level}: room between one spawn and the next`, () => {
    it.each([
      { turbo: 'without Turbo', turboEvery: 0 },
      { turbo: 'with Turbo cutting in every 700 steps', turboEvery: 700 },
      { turbo: 'with Turbo cutting in every 430 steps', turboEvery: 430 },
    ])(
      `is always at least ${fair.breathing} steps, $turbo`,
      ({ turboEvery }) => {
        const tight: string[] = [];
        let compared = 0;
        for (const board of BOARD_IDS) {
          for (let seed = 1; seed <= 25; seed++) {
            const visits = hazardVisits(createRun(board, level), { state: seed }, RUN_STEPS, turboEvery);
            for (let i = 1; i < visits.length; i++) {
              const room = visits[i].first - visits[i - 1].last;
              compared++;
              if (room < fair.breathing) {
                tight.push(`${board} seed ${seed}, step ${visits[i].first}: ${visits[i - 1].types} then ${visits[i].types}, ${room}`);
              }
            }
          }
        }
        expect(compared).toBeGreaterThan(8000);
        expect(tight.slice(0, 8)).toEqual([]);
      },
      60000,
    );
  });

  describe(`${level}: time to see it coming`, () => {
    it(`gives at least ${fair.warning} steps of warning for everything`, () => {
      const late: string[] = [];
      for (const pattern of sends) {
        for (const board of BOARD_IDS) {
          for (const speed of SPEEDS) {
            for (const seed of [1, 2, 3, 4]) {
              const worst = shortestWarning(onePattern(level, board, speed, pattern, seed));
              if (worst.steps < fair.warning) late.push(`${pattern}, ${board}, ${speed.name}: ${worst.type} ${worst.steps}`);
            }
          }
        }
      }
      expect(late.slice(0, 8)).toEqual([]);
    });
  });
}
