import { describe, expect, it } from 'vitest';
import { budgetMs, chapterLevels, CHAPTER_PACE, SECONDS_PER_MARK, starsFor, weakestCodes, xpFor } from './progression';
import {
  answerCurrent,
  canCast,
  castSpell,
  createRaid,
  currentItem,
  paceProgress,
  raidMarks,
  SLOW_MS,
  SPELL_COST,
  START_STARDUST,
  stardustFor,
  tick,
  timeLeftMs,
} from './raid';
import { rat } from './rational';
import { createRng } from './satsRandom';
import type { NumberItem } from './satsTypes';

const item = (key: string, marks = 1): NumberItem => ({
  kind: 'number',
  id: key,
  key,
  realm: 'arithmetic',
  level: 3,
  code: '6C7a',
  marks,
  prompt: '1 + 1 =',
  answer: rat(2),
  display: '2',
  explain: ['2'],
});

describe('real-paper pace', () => {
  it('matches the STA paper timings', () => {
    expect(SECONDS_PER_MARK.arithmetic).toBe(45); // 40 marks in 30 minutes
    expect(SECONDS_PER_MARK.grammar).toBe(54); // 50 marks in 45 minutes
    expect(SECONDS_PER_MARK.reading).toBe(72); // 50 marks in 60 minutes
    expect(SECONDS_PER_MARK.reasoning).toBeCloseTo(68.57, 2); // 35 marks in 40 minutes
  });

  it('starts gentle, reaches real pace at chapter 4 and goes a little faster at chapter 5', () => {
    expect(CHAPTER_PACE[3]).toBe(1);
    for (let i = 1; i < CHAPTER_PACE.length; i++) expect(CHAPTER_PACE[i]!).toBeLessThan(CHAPTER_PACE[i - 1]!);
    expect(budgetMs('arithmetic', 1, 4, 'standard')).toBe(45_000);
    expect(budgetMs('arithmetic', 2, 1, 'standard')).toBe(144_000);
    expect(budgetMs('arithmetic', 1, 4, 'extra')).toBe(56_250);
    expect(budgetMs('arithmetic', 1, 4, 'off')).toBeNull();
  });

  it('builds a raid from easy to hard around the chapter level', () => {
    const levels = chapterLevels(3, 40, createRng(2));
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
    expect(levels.every((l) => l >= 2 && l <= 4)).toBe(true);
    expect(chapterLevels(1, 20, createRng(3)).every((l) => l <= 2)).toBe(true);
    expect(chapterLevels(5, 20, createRng(3)).every((l) => l >= 4)).toBe(true);
  });
});

describe('raid', () => {
  it('sets the boss health to the total marks and the hourglass to the total budget', () => {
    const raid = createRaid([item('a'), item('b', 2)], [10_000, 20_000]);
    expect(raid.hpMax).toBe(3);
    expect(raid.timeLimitMs).toBe(30_000);
    expect(timeLeftMs(raid)).toBe(30_000);
    expect(currentItem(raid)?.key).toBe('a');
  });

  it('deals marks for correct answers only and never takes time for wrong ones', () => {
    let raid = createRaid([item('a'), item('b', 2), item('c')], [10_000, 20_000, 10_000]);
    raid = tick(raid, 4_000);
    raid = answerCurrent(raid, true);
    expect(raid.hp).toBe(3);
    const before = timeLeftMs(raid);
    raid = answerCurrent(raid, false);
    expect(raid.hp).toBe(3);
    expect(timeLeftMs(raid)).toBe(before);
    raid = answerCurrent(raid, true);
    expect(raid.finished).toBe(true);
    expect(raid.endReason).toBe('done');
    expect(raidMarks(raid)).toBe(2);
    expect(raid.answers.map((a) => a.correct)).toEqual([true, false, true]);
  });

  it('ends when the hourglass runs out', () => {
    let raid = createRaid([item('a'), item('b')], [5_000, 5_000]);
    raid = tick(raid, 9_999);
    expect(raid.finished).toBe(false);
    raid = tick(raid, 5);
    expect(raid.finished).toBe(true);
    expect(raid.endReason).toBe('time');
    expect(timeLeftMs(raid)).toBe(0);
    expect(answerCurrent(raid, true)).toBe(raid);
  });

  it('has no hourglass with the timer off', () => {
    let raid = createRaid([item('a')], [null]);
    expect(raid.timeLimitMs).toBeNull();
    raid = tick(raid, 10_000_000);
    expect(raid.finished).toBe(false);
    expect(timeLeftMs(raid)).toBeNull();
    expect(canCast({ ...raid, stardust: 9 }, 'slow')).toBe(false);
  });

  it('pays stardust for quick correct answers', () => {
    expect(stardustFor(10_000, 4_000)).toBe(2);
    expect(stardustFor(10_000, 9_000)).toBe(1);
    expect(stardustFor(10_000, 12_000)).toBe(0);
    expect(stardustFor(null, 60_000)).toBe(1);
    let raid = createRaid([item('a'), item('b')], [10_000, 10_000]);
    raid = answerCurrent(tick(raid, 3_000), true);
    expect(raid.stardust).toBe(START_STARDUST + 2);
    raid = answerCurrent(tick(raid, 3_000), false);
    expect(raid.stardust).toBe(START_STARDUST + 2);
  });

  it('casts spells only with enough stardust; slow time halves the hourglass for 20 seconds', () => {
    let raid = createRaid([item('a'), item('b')], [60_000, 60_000]);
    expect(canCast(raid, 'hint')).toBe(false);
    raid = { ...raid, stardust: SPELL_COST.slow + SPELL_COST.hint };
    raid = castSpell(raid, 'slow');
    expect(raid.slowLeftMs).toBe(SLOW_MS);
    expect(canCast(raid, 'slow')).toBe(false);
    raid = tick(raid, 20_000);
    expect(raid.elapsedMs).toBe(10_000);
    raid = tick(raid, 1_000);
    expect(raid.elapsedMs).toBe(11_000);
    raid = castSpell(raid, 'hint');
    expect(raid.hintUsed).toBe(true);
    expect(raid.stardust).toBe(0);
    expect(castSpell(raid, 'hint')).toBe(raid);
  });

  it('moves the Pace Owl at budget pace', () => {
    let raid = createRaid([item('a'), item('b'), item('c'), item('d')], [10_000, 10_000, 10_000, 10_000]);
    expect(paceProgress(raid)).toEqual({ owl: 0, hero: 0 });
    raid = tick(raid, 15_000);
    expect(paceProgress(raid).owl).toBeCloseTo(1.5 / 4);
    raid = answerCurrent(answerCurrent(raid, true), true);
    expect(paceProgress(raid).hero).toBe(0.5);
  });

  it('rejects an empty raid or mismatched budgets', () => {
    expect(() => createRaid([], [])).toThrow();
    expect(() => createRaid([item('a')], [])).toThrow();
  });
});

describe('stars, XP and weak spots', () => {
  it('gives stars for the share of marks, with three stars only in time', () => {
    expect(starsFor(4, 10, true)).toBe(0);
    expect(starsFor(5, 10, true)).toBe(1);
    expect(starsFor(7, 10, true)).toBe(2);
    expect(starsFor(9, 10, true)).toBe(3);
    expect(starsFor(10, 10, false)).toBe(2);
    expect(starsFor(0, 0, true)).toBe(0);
  });

  it('rewards marks and stars', () => {
    expect(xpFor(8, 2)).toBe(120);
  });

  it('finds the weakest codes that were asked at least twice', () => {
    const stats = { '6C7a': { a: 4, c: 1 }, '6F4': { a: 2, c: 1 }, '6R2': { a: 1, c: 0 }, '5C2': { a: 5, c: 5 } };
    expect(weakestCodes(stats)).toEqual(['6C7a', '6F4']);
    expect(weakestCodes(stats, new Set(['6F4']))).toEqual(['6F4']);
  });
});
