/**
 * Skate Rush 3 — each level asks for more than the one before. The measure is the reaction time
 * the on-screen bot can get away with: at each step up, there is a reaction time with which it
 * survives every run on the easier level and not on the harder one.
 */
import { describe, expect, it } from 'vitest';
import type { LevelId } from './skateLevels';
import { SIGHT_RUNS, survivesOnSight } from './skateSight.testkit';

const survived = (level: LevelId, reaction: number): number =>
  SIGHT_RUNS.filter(({ board, seed }) => survivesOnSight(level, board, seed, reaction).ok).length;

describe('each level is harder than the one before', () => {
  it('Medium needs quicker reactions than Easy (0.4 s is enough for one, not the other)', () => {
    expect(survived('easy', 24)).toBeGreaterThanOrEqual(SIGHT_RUNS.length - 2);
    expect(survived('medium', 24)).toBeLessThanOrEqual(SIGHT_RUNS.length / 2);
  }, 120000);

  it('Hard needs quicker reactions than Medium (0.35 s is enough for one, not the other)', () => {
    expect(survived('medium', 21)).toBe(SIGHT_RUNS.length);
    expect(survived('hard', 21)).toBeLessThanOrEqual(SIGHT_RUNS.length / 2);
  }, 120000);

  it('Extreme is nearly impossible: 0.25 s, enough for Hard, never survives it', () => {
    expect(survived('hard', 15)).toBe(SIGHT_RUNS.length);
    expect(survived('extreme', 15)).toBe(0);
  }, 120000);

  it('but not impossible: 0.2 s survives every Extreme run', () => {
    expect(survived('extreme', 12)).toBe(SIGHT_RUNS.length);
  }, 120000);
});
