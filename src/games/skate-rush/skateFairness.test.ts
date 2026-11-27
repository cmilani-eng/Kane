/**
 * Skate Rush 3 — fairness, proved by playing.
 *  1. Under every low ceiling, on every deck, at the slowest and fastest speeds: one jump gets
 *     through, and no second jump does.
 *  2. Every pattern, alone, has a way through that does not need frame-perfect presses.
 *  3. Whole seeded runs, where patterns follow each other as in the game, can be survived.
 *  4. A bot could chain jumps no person would, so in those runs there is also time to breathe
 *     between one spawn and the next. With 2, that makes every sequence of patterns beatable.
 */
import { describe, expect, it } from 'vitest';
import {
  BOARD_IDS,
  PATTERNS,
  SKATER_X,
  UNDER,
  createRun,
  hazardBox,
  isCeiling,
  spawnPattern,
  type BoardId,
  type Item,
  type Pattern,
  type Run,
  type UnderPattern,
} from './skateRules';
import { advance, allBehind, copyRun, findWayThrough, hazardVisits, roll, type Dice } from './skateSolver.testkit';

/** Frames that give the slowest world speed (6) and the fastest (12.5). */
const SPEEDS = [
  { name: 'slowest', frame: 0, turbo: 0 },
  { name: 'slowest with Turbo', frame: 0, turbo: 100000 },
  { name: 'fastest', frame: 100000, turbo: 0 },
  { name: 'fastest with Turbo', frame: 100000, turbo: 100000 },
] as const;
type Speed = (typeof SPEEDS)[number];

/** A run on which only the asked-for pattern ever appears. */
function onePattern(board: BoardId, speed: Speed, pattern: Pattern, seed: number): Run {
  const run = createRun(board);
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

describe('under a low ceiling', () => {
  const cases = (Object.keys(UNDER) as UnderPattern[]).flatMap((pattern) =>
    BOARD_IDS.flatMap((board) => SPEEDS.map((speed) => ({ pattern, board, speed, name: speed.name }))),
  );

  it.each(cases)('$pattern, $board deck, $name: one jump gets through, two never do', ({ pattern, board, speed }) => {
    // Several seeds, for the different widths of spikes and pits.
    for (const seed of [1, 2, 3]) {
      const result = tryEveryJump(onePattern(board, speed, pattern, seed));
      // Eight steps is 130 ms to press in.
      expect(result.singleWindow).toBeGreaterThanOrEqual(8);
      expect(result.secondJumpsTried).toBeGreaterThan(500);
      expect(result.cheats).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------- 2. each pattern alone

/** Presses are only allowed every GRID steps, whichever step the grid starts on: 100 ms of slack. */
const GRID = 6;

describe('every pattern on its own', () => {
  const cases = PATTERNS.flatMap((pattern) => BOARD_IDS.map((board) => ({ pattern, board })));

  it.each(cases)('$pattern can be passed on the $board deck at any speed', ({ pattern, board }) => {
    const failures: string[] = [];
    for (const speed of SPEEDS) {
      for (const seed of [1, 2, 3, 4]) {
        for (let offset = 0; offset < GRID; offset++) {
          const found = findWayThrough(onePattern(board, speed, pattern, seed), { state: seed }, {
            grid: GRID,
            offset,
            done: allBehind,
            budget: 40000,
          });
          if (!found.ok) failures.push(`${speed.name}, seed ${seed}, grid offset ${offset}: ${found.blockedBy}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

// ---------------------------------------------------------------- 3. whole runs

/** Long enough to reach top speed (12.5 from step 12350) and the tightest gaps (score 900). */
const RUN_STEPS = 15000;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

describe('whole runs', () => {
  const cases = BOARD_IDS.flatMap((board) => SEEDS.map((seed) => ({ board, seed })));

  it.each(cases)('seed $seed on the $board deck can be survived past top speed', ({ board, seed }) => {
    const found = findWayThrough(createRun(board), { state: seed }, {
      grid: 4,
      offset: seed % 4,
      done: (run) => run.frame >= RUN_STEPS,
      budget: 600000,
    });
    expect(found.ok, `stuck at step ${found.furthest} with ${found.blockedBy}`).toBe(true);
  }, 60000);

  it('between them, put every kind of hazard in front of the bot', () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const run = createRun('basic');
      const dice: Dice = { state: seed };
      while (run.frame < RUN_STEPS) {
        // Only watching what spawns: items are cleared so that nothing can end the run.
        advance(run, dice, false);
        for (const o of run.items) seen.add(o.type);
        run.items = run.items.filter((o) => o.type === 'boss' && o.x > SKATER_X + 100);
        run.over = false;
      }
    }
    for (const type of ['bomb', 'bridge', 'lasernet', 'maces', 'boss', 'chaser', 'monster', 'roller', 'bird', 'animal', 'robot']) {
      expect(seen, type).toContain(type);
    }
  });
});

// ---------------------------------------------------------------- 4. room between spawns

/** 0.7 s from one spawn's hazards leaving the skater to the next one's arriving. */
const BREATHING_STEPS = 42;

describe('room between one spawn and the next', () => {
  it.each([
    { turbo: 'without Turbo', turboEvery: 0 },
    { turbo: 'with Turbo cutting in every 700 steps', turboEvery: 700 },
    { turbo: 'with Turbo cutting in every 430 steps', turboEvery: 430 },
  ])('is always at least 0.7 s, $turbo', ({ turboEvery }) => {
    const tight: string[] = [];
    let compared = 0;
    for (const board of BOARD_IDS) {
      for (let seed = 1; seed <= 25; seed++) {
        const visits = hazardVisits(createRun(board), { state: seed }, RUN_STEPS, turboEvery);
        for (let i = 1; i < visits.length; i++) {
          const room = visits[i].first - visits[i - 1].last;
          compared++;
          if (room < BREATHING_STEPS) {
            tight.push(`${board} seed ${seed}, step ${visits[i].first}: ${visits[i - 1].types} then ${visits[i].types}, ${room}`);
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(10000);
    expect(tight).toEqual([]);
  }, 60000);
});
