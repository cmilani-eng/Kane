/**
 * Quest progression: real-paper pace per realm, chapters that move from gentle pace to
 * faster-than-real pace, which levels a chapter's questions come from, stars and XP.
 *
 * Real pace (STA test frameworks): maths Paper 1 is 40 marks in 30 minutes; Papers 2 and 3
 * are 35 marks in 40 minutes each; GPS Paper 1 is 50 marks in 45 minutes; the spelling test
 * is 20 words in about 15 minutes; reading is 50 marks in 60 minutes including reading time.
 *
 * Called by: placement.ts, raid planning in satsController.ts. Tested by: progression.test.ts
 */
import { int, type Rng } from './satsRandom';
import type { Level, RealmId, TimerMode } from './satsTypes';

export const SECONDS_PER_MARK: Record<RealmId, number> = {
  arithmetic: (30 * 60) / 40,
  reasoning: (40 * 60) / 35,
  grammar: (45 * 60) / 50,
  spelling: (15 * 60) / 20,
  reading: (60 * 60) / 50,
};

export const CHAPTERS = 5;

/**
 * Time multiplier per chapter: chapter 1 gives 60% more time than the real paper, chapter 4
 * is real pace and chapter 5 is a little faster, so children get used to the clock gradually.
 */
export const CHAPTER_PACE: readonly number[] = [1.6, 1.4, 1.2, 1.0, 0.9];

/** Extra time is +25%, modelled on KS2 access arrangements. `null` means no timer. */
export const TIMER_FACTOR: Record<TimerMode, number | null> = { standard: 1, extra: 1.25, off: null };

/** Questions per raid (reading uses a whole passage instead). */
export const RAID_SIZE: Record<Exclude<RealmId, 'reading'>, number> = {
  arithmetic: 8,
  reasoning: 5,
  grammar: 8,
  spelling: 8,
};

export function clampChapter(chapter: number): number {
  return Math.min(CHAPTERS, Math.max(1, Math.round(chapter)));
}

/** The level a chapter centres on. */
export function chapterLevel(chapter: number): Level {
  return clampChapter(chapter) as Level;
}

/**
 * Levels for a raid: half at the chapter's level, a quarter each one below and one above
 * (kept within 1–5), sorted easiest first like a real paper.
 */
export function chapterLevels(chapter: number, count: number, rng: Rng): Level[] {
  const centre = chapterLevel(chapter);
  const levels: Level[] = [];
  for (let i = 0; i < count; i++) {
    const roll = int(rng, 0, 3);
    const offset = roll === 0 ? -1 : roll === 3 ? 1 : 0;
    levels.push(Math.min(5, Math.max(1, centre + offset)) as Level);
  }
  return levels.sort((a, b) => a - b);
}

/** Seconds a question is worth at real pace × chapter pace × timer mode, or null with no timer. */
export function budgetMs(realm: RealmId, marks: number, chapter: number, timer: TimerMode): number | null {
  const factor = TIMER_FACTOR[timer];
  if (factor === null) return null;
  return Math.round(marks * SECONDS_PER_MARK[realm] * CHAPTER_PACE[clampChapter(chapter) - 1]! * factor * 1000);
}

/** The Clockwork Dragon (mock) runs at real pace. */
export const MOCK_CHAPTER = 4;
export const MOCK_PLAN: readonly { realm: Exclude<RealmId, 'reading'>; count: number }[] = [
  { realm: 'arithmetic', count: 5 },
  { realm: 'reasoning', count: 2 },
  { realm: 'grammar', count: 3 },
  { realm: 'spelling', count: 2 },
];

/** Stars from the share of the boss's health removed. Three stars also needs the raid finished in time. */
export function starsFor(marks: number, marksAvailable: number, finishedInTime: boolean): number {
  if (marksAvailable <= 0) return 0;
  const share = marks / marksAvailable;
  if (share >= 0.9 && finishedInTime) return 3;
  if (share >= 0.7) return 2;
  if (share >= 0.5) return 1;
  return 0;
}

/** Two stars clears a chapter and opens the next one. */
export const CLEAR_STARS = 2;

export function xpFor(marks: number, stars: number): number {
  return marks * 10 + stars * 20;
}

export interface CodeStat {
  readonly a: number;
  readonly c: number;
}

/** The weakest content codes (lowest success rate, asked at least twice), for the next raid to lean on. */
export function weakestCodes(stats: Readonly<Record<string, CodeStat>>, allowed?: ReadonlySet<string>, count = 2): string[] {
  return Object.entries(stats)
    .filter(([code, s]) => s.a >= 2 && s.c < s.a && (!allowed || allowed.has(code)))
    .sort(([, x], [, y]) => x.c / x.a - y.c / y.a || y.a - x.a)
    .slice(0, count)
    .map(([code]) => code);
}
