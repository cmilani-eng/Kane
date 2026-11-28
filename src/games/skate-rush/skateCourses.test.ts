/**
 * Skate Rush 3 — the timing courses. What makes them courses is that they ask for exact presses,
 * not just quick ones, so that is what is held here: every press has at least 8 steps (a little
 * over an eighth of a second) and no more than 13. That each can also be passed after any other
 * pattern, and in whole runs, is held by skateFairness.extreme.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { COURSES, COURSE_IDS, NOTICE_STEPS, courseSteps, type CourseId } from './skateCourses';
import { LEVEL_IDS, LEVELS } from './skateLevels';
import {
  PATTERNS,
  VIEW_W,
  courseAhead,
  createRun,
  cruiseSpeed,
  spawnItem,
  spawnPattern,
  stepRun,
  type BoardId,
  type Run,
  type Spawnable,
} from './skateRules';
import { roll } from './skateSolver.testkit';
import { PHYSICS_DECKS } from './skatePairs.testkit';
import { BEATS, leavesRoom, rhythmBeats } from './skateTiming.testkit';

const LEAST_ROOM = 8;
const MOST_ROOM = 13;
/** Less than any single pattern ever asks for, and well over any course. */
const ROOM_ALONE = 20;

/** Frames that give a level's starting speed and its top speed. */
const SLOWEST = 0;
const FASTEST = 100000;
const STEADY = [SLOWEST, FASTEST].flatMap((frame) => [0, 100000].map((turbo) => ({ frame, turbo })));

function only(what: Spawnable, board: BoardId, frame: number, turbo: number, seed = 1): Run {
  const run = createRun(board, 'extreme');
  run.frame = frame;
  run.turbo = turbo;
  run.spawn = 1e9;
  spawnPattern(run, what, roll({ state: seed }));
  return run;
}

describe('which levels send courses', () => {
  it.each(LEVEL_IDS.filter((id) => id !== 'extreme'))('%s sends none', (level) => {
    const random = roll({ state: 5 });
    for (let i = 0; i < 2000; i++) expect(spawnItem(createRun('basic', level), random).past).toBeUndefined();
  });

  it('Extreme makes about one spawn in three a course', () => {
    const random = roll({ state: 5 });
    let courses = 0;
    for (let i = 0; i < 3000; i++) if (spawnItem(createRun('basic', 'extreme'), random).past !== undefined) courses++;
    expect(courses).toBeGreaterThan(900);
    expect(courses).toBeLessThan(1100);
  });

  it.each(COURSE_IDS.map((id, i) => ({ id, i })))('Extreme can send $id', ({ id, i }) => {
    // The first number says "a course", the second which one.
    const numbers = [0, (i + 0.5) / COURSE_IDS.length];
    const run = createRun('basic', 'extreme');
    spawnItem(run, () => numbers.shift() ?? 0.5);
    expect(run.items.map((o) => o.type)).toEqual(COURSES[id].map((p) => p.type));
  });
});

describe('a course on the track', () => {
  it.each(COURSE_IDS)('%s is spaced in steps of travel, so its rhythm is the same at any speed', (id: CourseId) => {
    for (const frame of [SLOWEST, FASTEST]) {
      const run = only(id, 'basic', frame, 0);
      const speed = cruiseSpeed(run);
      run.items.forEach((o, i) => {
        expect((o.x - VIEW_W - 20) / speed).toBeCloseTo(NOTICE_STEPS + COURSES[id][i].at, 6);
        // Spikes round to whole teeth, at most one step out.
        expect(Math.abs(o.w / speed - COURSES[id][i].long)).toBeLessThanOrEqual(1.05);
      });
    }
  });

  it.each(COURSE_IDS)('%s is on the map from the moment it is sent until its last piece is passed', (id: CourseId) => {
    const run = only(id, 'basic', SLOWEST, 0);
    const ahead = courseAhead(run);
    expect(ahead?.id).toBe(id);
    expect(run.items.every((o) => ahead?.has(o))).toBe(true);
    // Sent before any of it is on screen, so the map is the first sight of it.
    expect(run.items.every((o) => o.x > VIEW_W)).toBe(true);
    let mapped = 0;
    let inIt = 0;
    while (courseAhead(run) && mapped < 1000) {
      // Held out of the way: only the map is being checked.
      run.player.y = -2000;
      run.player.vy = 0;
      if ((courseAhead(run)?.steps ?? 0) < 0) inIt++;
      stepRun(run, () => 0.5);
      mapped++;
    }
    expect(Math.abs(inIt - courseSteps(id))).toBeLessThanOrEqual(8);
    expect(courseAhead(run)).toBeUndefined();
  });

  it('maps the nearer of two courses', () => {
    const run = only('tunnel', 'basic', SLOWEST, 0);
    for (const o of run.items) o.x -= 500;
    spawnPattern(run, 'triple-hop', () => 0.5);
    expect(courseAhead(run)?.id).toBe('tunnel');
    expect(run.items.filter((o) => courseAhead(run)?.has(o))).toHaveLength(COURSES.tunnel.length);
  });

  it('has its coins and power-up past the end of it, not among its hazards', () => {
    const run = createRun('basic', 'extreme');
    run.spawn = 1;
    // All noughts: a course, coins and a power-up.
    stepRun(run, () => 0);
    const pickups = run.items.filter((o) => o.type === 'coin' || o.type === 'power');
    const end = Math.max(...run.items.filter((o) => !pickups.includes(o)).map((o) => o.x + o.w));
    expect(pickups).toHaveLength(6);
    for (const o of pickups) expect(o.x).toBeGreaterThan(end);
  });
});

describe('a course asks for exact presses', () => {
  it.each(COURSE_IDS)(
    `%s gives every press ${LEAST_ROOM} to ${MOST_ROOM} steps, on every deck at every speed`,
    (id) => {
      for (const board of PHYSICS_DECKS) {
        for (const { frame, turbo } of STEADY) {
          const where = `${board}, frame ${frame}, Turbo ${turbo}`;
          expect(leavesRoom(only(id, board, frame, turbo), LEAST_ROOM), where).toBe(true);
          expect(leavesRoom(only(id, board, frame, turbo), MOST_ROOM + 1), where).toBe(false);
        }
      }
    },
    60000,
  );

  it.each(COURSE_IDS)(
    `%s still gives every press ${LEAST_ROOM} steps when Turbo starts or stops part-way`,
    (id) => {
      const tight: string[] = [];
      for (const board of PHYSICS_DECKS) {
        for (const frame of [SLOWEST, FASTEST]) {
          for (const after of [100, 130, 160, 190, 220]) {
            // Turbo already on, with this much of it left.
            if (!leavesRoom(only(id, board, frame, after), LEAST_ROOM))
              tight.push(`${board} ${frame}: stops after ${after}`);
            // A Turbo picked up on the way.
            const run = only(id, board, frame, 0);
            const at = run.frame + after;
            const pickUp = (r: Run): void => {
              if (r.frame === at) r.turbo = 240;
            };
            if (!leavesRoom(run, LEAST_ROOM, pickUp)) tight.push(`${board} ${frame}: starts after ${after}`);
          }
        }
      }
      expect(tight).toEqual([]);
    },
    60000,
  );

  it.each(COURSE_IDS)('%s mostly stops a skater who just jumps every time the board lands', (id) => {
    for (const board of PHYSICS_DECKS) {
      for (const { frame, turbo } of STEADY) {
        expect(rhythmBeats(only(id, board, frame, turbo)), `${board}, ${frame}, ${turbo}`).toBeLessThanOrEqual(
          BEATS / 2,
        );
      }
    }
  });

  it.each(PATTERNS)(
    `is not asked by %s, which on its own leaves at least ${ROOM_ALONE} steps`,
    (pattern) => {
      const exact: string[] = [];
      for (const board of PHYSICS_DECKS) {
        for (const { frame, turbo } of STEADY) {
          for (const seed of [1, 2, 3]) {
            if (!leavesRoom(only(pattern, board, frame, turbo, seed), ROOM_ALONE)) {
              exact.push(`${board}, ${frame}, ${turbo}, seed ${seed}`);
            }
          }
        }
      }
      expect(exact).toEqual([]);
    },
    60000,
  );

  it('is what Extreme alone is given', () => {
    expect(LEVEL_IDS.filter((id) => LEVELS[id].courses > 0)).toEqual(['extreme']);
  });
});
