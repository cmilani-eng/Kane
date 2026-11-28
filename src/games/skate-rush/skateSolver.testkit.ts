/**
 * Test helper for Skate Rush 3: bots that play the real rules. To stand in for a human they may
 * only press on a coarse grid of steps, and they never lean on a Shield.
 *  - `findWayThrough` backtracks over everything, including what has not appeared yet.
 *  - `playAsSeen` plans only around what is on screen, a reaction time after it appears. On screen
 *    includes the whole of the timing course the map shows.
 *
 * Called by: src/games/skate-rush/skateFairness.testkit.ts, skatePairs.testkit.ts, skateEasy.test.ts,
 * skateTiming.testkit.ts, skateCourses.test.ts
 */
import {
  MAX_JUMPS,
  SKATER_X,
  VIEW_W,
  courseAhead,
  hazardBox,
  isCeiling,
  jump,
  stepRun,
  type Item,
  type Random,
  type Run,
} from './skateRules';

/** A random source whose position can be copied, so the bot can go back in time. */
export interface Dice {
  state: number;
}

export function roll(dice: Dice): Random {
  return () => {
    dice.state = (dice.state + 0x6d2b79f5) | 0;
    let t = Math.imul(dice.state ^ (dice.state >>> 15), 1 | dice.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sparks are only for show; a fixed source keeps them from changing what spawns. */
const sparks: Random = () => 0.5;

export function copyRun(run: Run): Run {
  return { ...run, player: { ...run.player }, items: run.items.map((o) => ({ ...o })), particles: [] };
}

/** One step, pressing first if asked, with any Shield taken away again. */
export function advance(run: Run, dice: Dice, press: boolean): void {
  if (press) jump(run, sparks);
  stepRun(run, roll(dice), sparks);
  run.shield = false;
}

/** True once nothing that can hurt is level with or ahead of the skater. */
export function allBehind(run: Run): boolean {
  return run.items.every((o) => o.type === 'coin' || o.type === 'power' || o.x + o.w < SKATER_X + 5);
}

export interface Search {
  /** The bot may press only every `grid` steps, `offset` steps into each. */
  grid: number;
  offset: number;
  done: (run: Run) => boolean;
  /** Give up after trying this many moves. */
  budget: number;
  /** Called before each step, for a test that puts hazards on the track itself. */
  beforeStep?: (run: Run) => void;
  /** The most jumps the bot may use in one airtime: all of them unless told otherwise. */
  jumps?: number;
}

export interface Outcome {
  ok: boolean;
  /** When it got through: whether it pressed, at each step. */
  presses: boolean[];
  /** The furthest step any attempt survived to, and what was on screen there. */
  furthest: number;
  blockedBy: string;
}

const describeItems = (run: Run): string =>
  run.items
    .filter((o) => o.type !== 'coin' && o.type !== 'power' && o.x < SKATER_X + 500)
    .map((o) => `${o.type}@${Math.round(o.x - SKATER_X)}`)
    .join(', ');

const stateKey = (run: Run, dice: Dice): string => {
  const p = run.player;
  const items = run.items
    .filter((o) => o.type !== 'coin' && o.type !== 'power')
    .map((o) => `${o.type}${Math.round(o.x)}:${Math.round(o.target ?? 0)}`)
    .join(',');
  return `${run.frame}|${p.y.toFixed(1)}|${p.vy.toFixed(1)}|${p.jumps}|${run.turbo}|${dice.state}|${items}`;
};

interface Node {
  run: Run;
  dice: Dice;
  /** Moves still to try from here: whether to press at this step. */
  moves: boolean[];
  /** Whether it pressed on the step that led here. */
  pressed: boolean;
}

function movesFrom(run: Run, search: Search): boolean[] {
  const canPress = run.frame % search.grid === search.offset && run.player.jumps < (search.jumps ?? MAX_JUMPS);
  // The depth-first search pops from the end, so it tries waiting first.
  return canPress ? [true, false] : [false];
}

/** Depth-first search for a sequence of presses that stays alive until `done`. */
export function findWayThrough(start: Run, startDice: Dice, search: Search): Outcome {
  const dead = new Set<string>();
  const stack: Node[] = [{ run: copyRun(start), dice: { ...startDice }, moves: movesFrom(start, search), pressed: false }];
  let tried = 0;
  let furthest = start.frame;
  let blockedBy = '';

  while (stack.length > 0 && tried < search.budget) {
    const node = stack[stack.length - 1];
    const press = node.moves.pop();
    if (press === undefined) {
      dead.add(stateKey(node.run, node.dice));
      stack.pop();
      continue;
    }
    tried++;
    const run = copyRun(node.run);
    const dice = { ...node.dice };
    search.beforeStep?.(run);
    advance(run, dice, press);
    if (run.over) {
      if (run.frame > furthest) {
        furthest = run.frame;
        blockedBy = describeItems(node.run);
      }
      continue;
    }
    if (search.done(run)) {
      const presses = [...stack.slice(1).map((n) => n.pressed), press];
      return { ok: true, presses, furthest: run.frame, blockedBy: '' };
    }
    if (dead.has(stateKey(run, dice))) continue;
    stack.push({ run, dice, moves: movesFrom(run, search), pressed: press });
  }
  return { ok: false, presses: [], furthest, blockedBy };
}

const isPickup = (o: Item): boolean => o.type === 'coin' || o.type === 'power';

/**
 * A way past everything on the track and back to the ground, chosen the way a player would. A
 * second jump is kept for when one will not do, and the search tries waiting first, so it jumps
 * as late as it can: either way the skater is soon free to answer whatever turns up next.
 */
function planAsAPlayerWould(view: Run, dice: Dice, search: Search): Outcome {
  const plan = (jumps: number): Outcome =>
    findWayThrough(view, dice, {
      grid: search.grid,
      offset: search.offset,
      budget: search.budget,
      jumps,
      done: (r) => allBehind(r) && r.player.jumps === 0,
    });
  const withOne = plan(1);
  return withOne.ok ? withOne : plan(MAX_JUMPS);
}

/**
 * Play like someone who cannot see the future: plan a way past the hazards taken in so far, as if
 * nothing else were coming, and plan again each time something new has been on screen for
 * `reaction` steps. A hazard it has not taken in yet is still really there. The pieces of the
 * timing course on the map are on screen with it, however far off they still are.
 */
export function playAsSeen(start: Run, startDice: Dice, search: Search & { reaction: number }): Outcome {
  const run = copyRun(start);
  const dice = { ...startDice };
  const seenAt = new Map<Item, number>();
  const takenIn = new Set<Item>();
  let plan: boolean[] = [];

  while (!search.done(run)) {
    let news = false;
    const mapped = courseAhead(run);
    for (const o of run.items) {
      if (isPickup(o) || takenIn.has(o)) continue;
      if ((o.x <= VIEW_W || mapped?.has(o)) && !seenAt.has(o)) seenAt.set(o, run.frame);
      const since = seenAt.get(o);
      if (since !== undefined && run.frame - since >= search.reaction) {
        takenIn.add(o);
        news = true;
      }
    }
    if (news || plan.length === 0) {
      const view = copyRun({ ...run, items: run.items.filter((o) => takenIn.has(o) || (isPickup(o) && o.x <= VIEW_W)) });
      view.spawn = 1e9;
      const found = planAsAPlayerWould(view, dice, search);
      if (!found.ok) return { ok: false, presses: [], furthest: run.frame, blockedBy: describeItems(run) };
      plan = found.presses;
    }
    advance(run, dice, plan.shift() ?? false);
    if (run.over) return { ok: false, presses: [], furthest: run.frame, blockedBy: describeItems(run) };
  }
  return { ok: true, presses: [], furthest: run.frame, blockedBy: '' };
}

/** When one spawn's hazards are level with the skater: the first step and the last. */
export interface Visit {
  first: number;
  last: number;
  types: string[];
}

/**
 * Watch a run without playing it (hits are ignored) and note when each spawn's hazards pass the
 * skater. Low ceilings are left out: one jump is safe anywhere under them. A bomb counts as part
 * of whoever threw it. With `turboEvery`, Turbo keeps cutting in while hazards are on their way.
 */
export function hazardVisits(start: Run, dice: Dice, steps: number, turboEvery = 0): Visit[] {
  const run = copyRun(start);
  const visits: Visit[] = [];
  const owner = new Map<Item, Visit>();

  while (run.frame < steps) {
    if (turboEvery > 0 && run.frame % turboEvery === 0) run.turbo = 240;
    const stillToThrow = new Map(run.items.map((o) => [o, o.throws?.length ?? 0]));
    advance(run, dice, false);
    run.over = false;
    // New bombs are in the same order as the enemies that threw them this step.
    const throwers = run.items.filter((o) => (stillToThrow.get(o) ?? 0) > (o.throws?.length ?? 0));
    let spawned: Visit | undefined;
    for (const o of run.items) {
      if (o.type === 'coin' || o.type === 'power' || isCeiling(o.type)) continue;
      let visit = owner.get(o);
      if (!visit) {
        if (o.type === 'bomb') {
          const thrower = throwers.shift();
          visit = thrower && owner.get(thrower);
        } else {
          if (!spawned) {
            spawned = { first: Infinity, last: 0, types: [] };
            visits.push(spawned);
          }
          visit = spawned;
        }
        if (!visit) continue;
        owner.set(o, visit);
        visit.types.push(o.type);
      }
      const box = o.type === 'pit' ? { x: o.x + 8, w: o.w - 16 } : hazardBox(o, run.frame);
      if (box.x <= SKATER_X + 46 && box.x + box.w >= SKATER_X + 9) {
        visit.first = Math.min(visit.first, run.frame);
        visit.last = Math.max(visit.last, run.frame);
      }
    }
  }
  return visits.filter((v) => v.last > 0).sort((a, b) => a.first - b.first);
}
