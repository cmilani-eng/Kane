/**
 * SATs Quest shared types: realms, bands, timer modes and the question items every realm
 * produces. Pure data only — no Phaser, no DOM, no Firebase.
 */
import type { Rational } from './rational';

/** One realm per tested area. Arithmetic and reasoning are the two maths components. */
export const REALM_IDS = ['arithmetic', 'reasoning', 'grammar', 'spelling', 'reading'] as const;
export type RealmId = (typeof REALM_IDS)[number];

/**
 * Practice bands shaped like the KS2 test outcomes: below the expected standard, at it, and
 * near the higher standard (scaled score 110+). They are practice estimates, never a
 * prediction of the real scaled score.
 */
export const BANDS = ['towards', 'expected', 'higher'] as const;
export type Band = (typeof BANDS)[number];
export type BandOrUnplaced = Band | 'unplaced';

/** Standard pace, extra time (+25%, modelled on KS2 access arrangements) or no timer. */
export const TIMER_MODES = ['standard', 'extra', 'off'] as const;
export type TimerMode = (typeof TIMER_MODES)[number];

export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

interface ItemBase {
  /** Template or bank entry id, stable across sessions (e.g. `ar.longMul3`, `gps.noun1`). */
  readonly id: string;
  /** Unique per generated instance, so a raid never repeats the same question. */
  readonly key: string;
  readonly realm: RealmId;
  readonly level: Level;
  /** Official STA test-framework content domain reference, e.g. `6C7a`, `G5.8`, `S47`, `2d`. */
  readonly code: string;
  /** Marks, as on the real paper (long multiplication and long division are worth 2). */
  readonly marks: number;
  readonly prompt: string;
  /** Worked steps or the rule, shown when an answer is wrong. Written or computed in code. */
  readonly explain: readonly string[];
}

/** A typed numeric answer: whole number, decimal, fraction or mixed number. */
export interface NumberItem extends ItemBase {
  readonly kind: 'number';
  readonly answer: Rational;
  /** The answer as shown after marking, e.g. `9,022`, `2.25`, `1 1/12`. */
  readonly display: string;
  /** Shown before / after the answer box, e.g. `£` or `cm`. */
  readonly unitBefore?: string;
  readonly unitAfter?: string;
}

/** Tick one option. */
export interface ChoiceItem extends ItemBase {
  readonly kind: 'choice';
  readonly options: readonly string[];
  readonly answer: number;
  /** Reading questions point at the passage they belong to. */
  readonly passageId?: string;
}

/** Tap one word in a sentence (word classes). */
export interface TapWordItem extends ItemBase {
  readonly kind: 'tapWord';
  readonly tokens: readonly string[];
  readonly answer: number;
}

/** Spelling: the word is read aloud in a sentence; the child types it (or picks it if no voice). */
export interface SpellItem extends ItemBase {
  readonly kind: 'spell';
  readonly word: string;
  /** The full sentence that is read aloud. */
  readonly sentence: string;
  /** The sentence with the word replaced by a gap, for the screen. */
  readonly gapped: string;
  /** The word plus three misspellings, shuffled — used when speech is unavailable. */
  readonly options: readonly string[];
}

export type Item = NumberItem | ChoiceItem | TapWordItem | SpellItem;

export type ItemResponse =
  | { readonly kind: 'number'; readonly text: string }
  | { readonly kind: 'choice'; readonly index: number }
  | { readonly kind: 'tapWord'; readonly index: number }
  | { readonly kind: 'spell'; readonly text: string };

/** A reading passage, written for SATs Quest (no past STA texts are reproduced). */
export interface Passage {
  readonly id: string;
  readonly level: Level;
  readonly title: string;
  readonly genre: 'story' | 'information' | 'poem';
  readonly paragraphs: readonly string[];
}
