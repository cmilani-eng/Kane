/**
 * Skate Rush 3 — how exact a press has to be. The other kits ask whether there is a way through;
 * this one asks how much earlier or later each press on the way may come.
 *
 * Called by: src/games/skate-rush/skateCourses.test.ts
 */
import { MAX_JUMPS, type Run } from './skateRules';
import { advance, allBehind, copyRun, type Dice } from './skateSolver.testkit';

/** Something done to the run from outside before each step: Turbo starting part-way, say. */
export type Meddle = (run: Run) => void;

const stateKey = (run: Run): string => {
  const p = run.player;
  const items = run.items.map((o) => `${o.type}${o.x.toFixed(1)}:${Math.round(o.target ?? 0)}`).join(',');
  return `${run.frame}|${p.y.toFixed(2)}|${p.vy.toFixed(2)}|${p.jumps}|${run.turbo}|${items}`;
};

/**
 * Whether the run can be got through with `room` steps in a row to make every press in: any of
 * them will do, as long as the presses after it are each given as much room. A run with
 * obstacles only, and nothing more to spawn, so the dice are never rolled.
 */
export function leavesRoom(start: Run, room: number, meddle?: Meddle): boolean {
  const known = new Map<string, boolean>();
  const dice: Dice = { state: 1 };
  const step = (run: Run, press: boolean): void => {
    meddle?.(run);
    advance(run, dice, press);
  };

  const from = (state: Run): boolean => {
    const key = stateKey(state);
    const before = known.get(key);
    if (before !== undefined) return before;
    const waiting = copyRun(state);
    let inARow = 0;
    let found = false;
    while (!found) {
      let good = false;
      if (waiting.player.jumps < MAX_JUMPS) {
        const pressed = copyRun(waiting);
        step(pressed, true);
        good = !pressed.over && (allBehind(pressed) || from(pressed));
      }
      inARow = good ? inARow + 1 : 0;
      if (inARow >= room) found = true;
      else {
        step(waiting, false);
        if (waiting.over) break;
        // Nothing left to hit, so no further press is needed at all.
        if (allBehind(waiting)) found = true;
      }
    }
    known.set(key, found);
    return found;
  };
  return from(start);
}

/** The most room every press can be given, up to `most`. */
export function widestRoom(start: Run, most = 40): number {
  let low = 0;
  let high = most;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (leavesRoom(start, middle)) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** How many starting moments `rhythmBeats` tries, two steps apart. */
export const BEATS = 24;

/**
 * Press without looking: from some moment on, jump the instant the board lands, every time. How
 * many of the `BEATS` starting moments get through.
 */
export function rhythmBeats(start: Run): number {
  let through = 0;
  for (let beat = 0; beat < BEATS; beat++) {
    const run = copyRun(start);
    const dice: Dice = { state: 1 };
    const first = run.frame + beat * 2;
    while (!run.over && !allBehind(run)) advance(run, dice, run.frame >= first && run.player.jumps === 0);
    if (!run.over) through++;
  }
  return through;
}
