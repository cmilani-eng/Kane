/**
 * Skate Rush 3 — timing courses: set pieces where it is not enough to see a hazard in time, each
 * press has to come at the right moment. Only the levels with a `courses` chance send them.
 *
 * Every number is in 60 Hz steps of travel, so a course keeps its rhythm at any speed. On the
 * track it is laid out at the cruising speed of the moment, so Turbo plays it a little faster.
 * The spacings were found by measuring how much earlier or later each press may come:
 * skateCourses.test.ts holds them to it.
 *
 * A course is far longer than what can be seen coming at Extreme's speed, so the whole of it is
 * mapped out at the bottom of the screen from the moment it is sent (skateCourseArt.ts).
 *
 * Called by: src/games/skate-rush/skateRules.ts, skateCourseArt.ts
 * Tested by: src/games/skate-rush/skateCourses.test.ts, skateFairness.extreme.test.ts
 */
import type { CeilingType } from './skateRules';

export const COURSE_IDS = ['triple-hop', 'leap-and-duck', 'hop-duck-hop', 'leap-to-roof', 'tunnel'] as const;
export type CourseId = (typeof COURSE_IDS)[number];

/** Extra steps of travel a course starts back, to give its map time to be read. */
export const NOTICE_STEPS = 30;

export interface Piece {
  readonly type: 'spikes' | 'pit' | 'laser' | CeilingType;
  /** Steps of travel from the front of the course to the front of this piece. */
  readonly at: number;
  /** How many steps of travel long it is. */
  readonly long: number;
}

export const COURSES: Readonly<Record<CourseId, readonly Piece[]>> = {
  // Three long beds of spikes in an uneven rhythm: a long beat, then a short one.
  'triple-hop': [
    { type: 'spikes', at: 0, long: 22 },
    { type: 'spikes', at: 50, long: 22 },
    { type: 'spikes', at: 92, long: 22 },
  ],
  // A pit only two jumps will cross, then a laser: leap long, but be down again in time.
  'leap-and-duck': [
    { type: 'pit', at: 0, long: 70 },
    { type: 'laser', at: 79, long: 8 },
  ],
  // The laser hangs where a late first hop, or an early second one, would be.
  'hop-duck-hop': [
    { type: 'spikes', at: 0, long: 16 },
    { type: 'laser', at: 29, long: 8 },
    { type: 'spikes', at: 65, long: 16 },
  ],
  // The second jump over the pit has to be down before the roof begins.
  'leap-to-roof': [
    { type: 'pit', at: 0, long: 62 },
    { type: 'bridge', at: 72, long: 54 },
    { type: 'spikes', at: 88, long: 14 },
  ],
  // One long roof, so single jumps only, over spikes that do not come to a steady beat.
  tunnel: [
    { type: 'lasernet', at: 0, long: 158 },
    { type: 'spikes', at: 16, long: 14 },
    { type: 'spikes', at: 58, long: 14 },
    { type: 'spikes', at: 120, long: 14 },
  ],
};

/** From the front of a course to the back of its last piece, in steps of travel. */
export const courseSteps = (id: CourseId): number => Math.max(...COURSES[id].map((p) => p.at + p.long));
