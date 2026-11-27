/**
 * Test helper for Skate Rush 3: a bot that looks for a way through. It plays the real rules and
 * backtracks. To stand in for a human it may only press on a coarse grid of steps, and it never
 * leans on a Shield.
 *
 * Called by: src/games/skate-rush/skateFairness.test.ts
 */
import { SKATER_X, hazardBox, isCeiling, jump, stepRun, type Item, type Random, type Run } from './skateRules';

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
}

export interface Outcome {
  ok: boolean;
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
}

function movesFrom(run: Run, search: Search): boolean[] {
  const canPress = run.frame % search.grid === search.offset && run.player.jumps < 2;
  // Popped from the end, so waiting is tried first.
  return canPress ? [true, false] : [false];
}

/** Depth-first search for a sequence of presses that stays alive until `done`. */
export function findWayThrough(start: Run, startDice: Dice, search: Search): Outcome {
  const dead = new Set<string>();
  const stack: Node[] = [{ run: copyRun(start), dice: { ...startDice }, moves: movesFrom(start, search) }];
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
    advance(run, dice, press);
    if (run.over) {
      if (run.frame > furthest) {
        furthest = run.frame;
        blockedBy = describeItems(node.run);
      }
      continue;
    }
    if (search.done(run)) return { ok: true, furthest: run.frame, blockedBy: '' };
    if (dead.has(stateKey(run, dice))) continue;
    stack.push({ run, dice, moves: movesFrom(run, search) });
  }
  return { ok: false, furthest, blockedBy };
}

/** When one spawn's hazards are level with the skater: the first step and the last. */
export interface Visit {
  first: number;
  last: number;
  types: string[];
}

/**
 * Watch a run without playing it (hits are ignored) and note when each spawn's hazards pass the
 * skater. Low ceilings are left out: one jump is safe anywhere under them. A boss's bomb counts
 * as part of the boss. With `turboEvery`, Turbo keeps cutting in while hazards are on their way.
 */
export function hazardVisits(start: Run, dice: Dice, steps: number, turboEvery = 0): Visit[] {
  const run = copyRun(start);
  const visits: Visit[] = [];
  const owner = new Map<Item, Visit>();
  let boss: Visit | undefined;

  while (run.frame < steps) {
    if (turboEvery > 0 && run.frame % turboEvery === 0) run.turbo = 240;
    advance(run, dice, false);
    run.over = false;
    let spawned: Visit | undefined;
    for (const o of run.items) {
      if (o.type === 'coin' || o.type === 'power' || isCeiling(o.type)) continue;
      let visit = owner.get(o);
      if (!visit) {
        if (o.type === 'bomb') visit = boss;
        else {
          if (!spawned) {
            spawned = { first: Infinity, last: 0, types: [] };
            visits.push(spawned);
          }
          visit = spawned;
          if (o.type === 'boss') boss = visit;
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
