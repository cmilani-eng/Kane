/**
 * The Royal Trial: a short adaptive placement per realm.
 *
 * Model: Rasch (1PL). P(correct) = 1 / (1 + e^-(θ − b)), where b is an item's difficulty in
 * logits (level 3 = 0) and θ is the child's ability. After each answer, θ is estimated by
 * EAP (expected a posteriori) over a grid with a standard normal prior. The next item is the
 * level whose difficulty is closest to the current estimate. The trial stops after the
 * realm's maximum length, or earlier once the estimate is precise enough.
 *
 * θ maps to three practice bands shaped like the KS2 outcomes. The cut-points are tunable
 * practice constants, anchored loosely to the published maths thresholds (about 52% of marks
 * for the expected standard and about 86% for 110 in 2025/2026). They are not a prediction
 * of a real scaled score.
 *
 * Called by: satsController.ts. Tested by: placement.test.ts
 */
import type { Band, Level, RealmId, TimerMode } from './satsTypes';
import { SECONDS_PER_MARK, TIMER_FACTOR } from './progression';

export interface PlacementResponse {
  readonly difficulty: number;
  readonly correct: boolean;
}

export interface Estimate {
  readonly mean: number;
  readonly sd: number;
}

const GRID: readonly number[] = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);

export function pCorrect(theta: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-(theta - difficulty)));
}

/**
 * Prior spread. A unit prior pulls a short trial's estimate back toward the middle so hard
 * that a child who misses level 2 and level 1 is offered level 2 again; 1.5 lets the trial
 * follow the child down (and up) within its few questions.
 */
export const PRIOR_SD = 1.5;

/** EAP estimate of θ with a normal prior (mean 0, sd `priorSd`). */
export function estimateAbility(responses: readonly PlacementResponse[], priorSd = PRIOR_SD): Estimate {
  let total = 0;
  let sum = 0;
  let sumSq = 0;
  for (const theta of GRID) {
    let weight = Math.exp(-(theta * theta) / (2 * priorSd * priorSd));
    for (const r of responses) {
      const p = pCorrect(theta, r.difficulty);
      weight *= r.correct ? p : 1 - p;
    }
    total += weight;
    sum += weight * theta;
    sumSq += weight * theta * theta;
  }
  const mean = sum / total;
  return { mean, sd: Math.sqrt(Math.max(0, sumSq / total - mean * mean)) };
}

export const levelDifficulty = (level: Level): number => level - 3;

/** The level whose difficulty is closest to θ (ties go to the easier level). */
export function nextLevel(theta: number): Level {
  let best: Level = 1;
  for (const level of [1, 2, 3, 4, 5] as const) {
    if (Math.abs(levelDifficulty(level) - theta) < Math.abs(levelDifficulty(best) - theta) - 1e-9) best = level;
  }
  return best;
}

/** Per realm: the first level asked (a gentle warm-up) and how many items to ask. */
export const PLACEMENT_PLAN: Record<Exclude<RealmId, 'reading'>, { first: Level; min: number; max: number }> = {
  arithmetic: { first: 2, min: 5, max: 7 },
  reasoning: { first: 2, min: 3, max: 4 },
  grammar: { first: 2, min: 4, max: 6 },
  spelling: { first: 2, min: 4, max: 5 },
};
/** Reading places with one mid-level passage and all of its questions. */
export const READING_PLACEMENT_LEVEL: Level = 3;

export const STOP_SD = 0.45;

export function shouldStop(realm: Exclude<RealmId, 'reading'>, responses: readonly PlacementResponse[]): boolean {
  const plan = PLACEMENT_PLAN[realm];
  if (responses.length >= plan.max) return true;
  if (responses.length < plan.min) return false;
  return estimateAbility(responses).sd < STOP_SD;
}

export function levelForNext(realm: Exclude<RealmId, 'reading'>, responses: readonly PlacementResponse[]): Level {
  if (responses.length === 0) return PLACEMENT_PLAN[realm].first;
  return nextLevel(estimateAbility(responses).mean);
}

/** θ below this is "working towards"; at or above HIGHER_CUT is "higher". */
export const EXPECTED_CUT = -0.6;
export const HIGHER_CUT = 1.1;

export function bandFor(theta: number): Band {
  if (theta < EXPECTED_CUT) return 'towards';
  if (theta < HIGHER_CUT) return 'expected';
  return 'higher';
}

/** Where the quest starts in a realm after placement (earlier chapters stay open for practice). */
export function startChapterFor(band: Band): number {
  return band === 'towards' ? 1 : band === 'expected' ? 3 : 4;
}

/** Each trial question gets the real-paper time for its marks, at a gentle 1.5× pace. */
export const PLACEMENT_PACE = 1.5;

export function placementItemMs(realm: RealmId, marks: number, timer: TimerMode): number | null {
  const factor = TIMER_FACTOR[timer];
  if (factor === null) return null;
  return Math.round(marks * SECONDS_PER_MARK[realm] * PLACEMENT_PACE * factor * 1000);
}
