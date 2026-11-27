/**
 * A boss raid as a pure state machine. The boss's health is the raid's total marks; each
 * correct answer deals that question's marks. The Moon Hourglass holds the raid's whole time
 * (the sum of every question's pace budget), so time saved on quick questions is there for
 * hard ones, just like on a real paper. A wrong answer never takes time away.
 *
 * Answering faster than a question's budget earns stardust, which buys spells:
 * a Hint (2) or Slow Time (3): the hourglass runs at half speed for 20 seconds.
 *
 * Called by: satsController.ts. Tested by: raid.test.ts
 */
import type { Item } from './satsTypes';

export const SPELL_COST = { hint: 2, slow: 3 } as const;
export type Spell = keyof typeof SPELL_COST;
export const SLOW_MS = 20_000;
export const SLOW_RATE = 0.5;
export const START_STARDUST = 1;
export const MAX_STARDUST = 9;

export interface RaidAnswer {
  readonly key: string;
  readonly code: string;
  readonly correct: boolean;
  readonly marks: number;
  readonly marksAvailable: number;
  readonly ms: number;
}

export interface RaidState {
  readonly items: readonly Item[];
  /** Per-question pace budget in ms, or null when there is no timer. */
  readonly budgetsMs: readonly (number | null)[];
  readonly index: number;
  readonly answers: readonly RaidAnswer[];
  readonly hpMax: number;
  readonly hp: number;
  /** Whole-raid time in ms, or null when there is no timer. */
  readonly timeLimitMs: number | null;
  /** Hourglass time used (slowed time counts at half). */
  readonly elapsedMs: number;
  /** Real time spent on the current question. */
  readonly questionMs: number;
  readonly slowLeftMs: number;
  readonly stardust: number;
  readonly hintUsed: boolean;
  readonly finished: boolean;
  readonly endReason: 'done' | 'time' | null;
}

export function createRaid(items: readonly Item[], budgetsMs: readonly (number | null)[]): RaidState {
  if (items.length === 0) throw new Error('a raid needs questions');
  if (budgetsMs.length !== items.length) throw new Error('one budget per question');
  const hpMax = items.reduce((sum, item) => sum + item.marks, 0);
  const timed = budgetsMs.every((b) => b !== null);
  return {
    items,
    budgetsMs,
    index: 0,
    answers: [],
    hpMax,
    hp: hpMax,
    timeLimitMs: timed ? budgetsMs.reduce<number>((sum, b) => sum + (b ?? 0), 0) : null,
    elapsedMs: 0,
    questionMs: 0,
    slowLeftMs: 0,
    stardust: START_STARDUST,
    hintUsed: false,
    finished: false,
    endReason: null,
  };
}

export function currentItem(state: RaidState): Item | null {
  return state.finished ? null : (state.items[state.index] ?? null);
}

/** Advance the clock by `dtMs` of real time. */
export function tick(state: RaidState, dtMs: number): RaidState {
  if (state.finished || dtMs <= 0) return state;
  const slowPart = Math.min(dtMs, state.slowLeftMs);
  const used = slowPart * SLOW_RATE + (dtMs - slowPart);
  const elapsedMs = state.elapsedMs + used;
  const next = { ...state, elapsedMs, questionMs: state.questionMs + dtMs, slowLeftMs: state.slowLeftMs - slowPart };
  if (state.timeLimitMs !== null && elapsedMs >= state.timeLimitMs) {
    return { ...next, elapsedMs: state.timeLimitMs, finished: true, endReason: 'time' };
  }
  return next;
}

export function timeLeftMs(state: RaidState): number | null {
  return state.timeLimitMs === null ? null : Math.max(0, state.timeLimitMs - state.elapsedMs);
}

/** Stardust for a correct answer: 1, plus 1 if it took under half its budget. No timer: 1. */
export function stardustFor(budgetMs: number | null, questionMs: number): number {
  if (budgetMs === null) return 1;
  if (questionMs > budgetMs) return 0;
  return questionMs <= budgetMs / 2 ? 2 : 1;
}

export function answerCurrent(state: RaidState, correct: boolean): RaidState {
  const item = currentItem(state);
  if (!item) return state;
  const marks = correct ? item.marks : 0;
  const answers = [
    ...state.answers,
    { key: item.key, code: item.code, correct, marks, marksAvailable: item.marks, ms: Math.round(state.questionMs) },
  ];
  const gained = correct ? stardustFor(state.budgetsMs[state.index] ?? null, state.questionMs) : 0;
  const index = state.index + 1;
  const done = index >= state.items.length;
  return {
    ...state,
    answers,
    index,
    hp: state.hp - marks,
    questionMs: 0,
    hintUsed: false,
    stardust: Math.min(MAX_STARDUST, state.stardust + gained),
    finished: done,
    endReason: done ? 'done' : null,
  };
}

export function canCast(state: RaidState, spell: Spell): boolean {
  if (state.finished || state.stardust < SPELL_COST[spell]) return false;
  if (spell === 'hint') return !state.hintUsed;
  return state.timeLimitMs !== null && state.slowLeftMs <= 0;
}

export function castSpell(state: RaidState, spell: Spell): RaidState {
  if (!canCast(state, spell)) return state;
  const stardust = state.stardust - SPELL_COST[spell];
  return spell === 'hint' ? { ...state, stardust, hintUsed: true } : { ...state, stardust, slowLeftMs: SLOW_MS };
}

/**
 * Where the Pace Owl is: how many questions a child working exactly at the budget pace would
 * have finished by now, as a share of the raid (0–1). The hero's share is questions answered.
 */
export function paceProgress(state: RaidState): { owl: number; hero: number } {
  const hero = state.answers.length / state.items.length;
  if (state.timeLimitMs === null) return { owl: hero, hero };
  let spent = 0;
  let owl = 0;
  for (const budget of state.budgetsMs) {
    const b = budget ?? 0;
    if (spent + b <= state.elapsedMs) {
      owl += 1;
      spent += b;
    } else {
      owl += b > 0 ? (state.elapsedMs - spent) / b : 0;
      break;
    }
  }
  return { owl: Math.min(1, owl / state.items.length), hero };
}

export function raidMarks(state: RaidState): number {
  return state.answers.reduce((sum, a) => sum + a.marks, 0);
}
