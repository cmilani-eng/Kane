import { describe, expect, it } from 'vitest';
import {
  bandFor,
  estimateAbility,
  EXPECTED_CUT,
  HIGHER_CUT,
  levelForNext,
  nextLevel,
  pCorrect,
  PLACEMENT_PLAN,
  placementItemMs,
  PRIOR_SD,
  shouldStop,
  startChapterFor,
  type PlacementResponse,
} from './placement';
import { createRng } from './satsRandom';

/** Simulate a child of true ability θ taking the adaptive trial. */
function simulate(theta: number, seed: number): { estimate: number; asked: number } {
  const rng = createRng(seed);
  const responses: PlacementResponse[] = [];
  while (!shouldStop('arithmetic', responses)) {
    const level = levelForNext('arithmetic', responses);
    const difficulty = level - 3;
    responses.push({ difficulty, correct: rng() < pCorrect(theta, difficulty) });
  }
  return { estimate: estimateAbility(responses).mean, asked: responses.length };
}

describe('Rasch model', () => {
  it('gives a 50% chance when ability equals difficulty', () => {
    expect(pCorrect(0, 0)).toBeCloseTo(0.5);
    expect(pCorrect(2, 0)).toBeGreaterThan(0.85);
    expect(pCorrect(-2, 0)).toBeLessThan(0.15);
  });

  it('starts at the prior and moves with the evidence', () => {
    expect(estimateAbility([]).mean).toBeCloseTo(0, 5);
    expect(estimateAbility([]).sd).toBeCloseTo(PRIOR_SD, 1);
    const right = estimateAbility([{ difficulty: 0, correct: true }]);
    const wrong = estimateAbility([{ difficulty: 0, correct: false }]);
    expect(right.mean).toBeGreaterThan(0);
    expect(wrong.mean).toBeLessThan(0);
    expect(right.mean).toBeCloseTo(-wrong.mean, 5);
  });

  it('gets more certain as answers come in', () => {
    const few = estimateAbility([{ difficulty: 0, correct: true }]);
    const many = estimateAbility(
      Array.from({ length: 8 }, (_, i) => ({ difficulty: (i % 3) - 1, correct: i % 2 === 0 })),
    );
    expect(many.sd).toBeLessThan(few.sd);
  });
});

describe('adaptive item choice', () => {
  it('picks the level nearest the current estimate', () => {
    expect(nextLevel(-3)).toBe(1);
    expect(nextLevel(0)).toBe(3);
    expect(nextLevel(0.5)).toBe(3);
    expect(nextLevel(0.6)).toBe(4);
    expect(nextLevel(3.5)).toBe(5);
  });

  it('warms up at level 2, then climbs after right answers and drops after wrong ones', () => {
    expect(levelForNext('arithmetic', [])).toBe(PLACEMENT_PLAN.arithmetic.first);
    const up = levelForNext('arithmetic', [
      { difficulty: -1, correct: true },
      { difficulty: 0, correct: true },
    ]);
    const down = levelForNext('arithmetic', [
      { difficulty: -1, correct: false },
      { difficulty: -2, correct: false },
    ]);
    expect(up).toBeGreaterThan(2);
    expect(down).toBeLessThan(2);
  });

  it('stops between the minimum and maximum length', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { asked } = simulate(0, seed);
      expect(asked).toBeGreaterThanOrEqual(PLACEMENT_PLAN.arithmetic.min);
      expect(asked).toBeLessThanOrEqual(PLACEMENT_PLAN.arithmetic.max);
    }
  });

  it('places strong children higher than struggling ones on average', () => {
    const avg = (theta: number) => {
      let sum = 0;
      for (let seed = 1; seed <= 200; seed++) sum += simulate(theta, seed).estimate;
      return sum / 200;
    };
    const low = avg(-2);
    const mid = avg(0);
    const high = avg(2);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
    expect(bandFor(low)).toBe('towards');
    expect(bandFor(high)).toBe('higher');
  });
});

describe('bands and starting chapter', () => {
  it('maps ability to the three practice bands', () => {
    expect(bandFor(EXPECTED_CUT - 0.01)).toBe('towards');
    expect(bandFor(EXPECTED_CUT)).toBe('expected');
    expect(bandFor(HIGHER_CUT - 0.01)).toBe('expected');
    expect(bandFor(HIGHER_CUT)).toBe('higher');
  });

  it('starts each band at a sensible chapter', () => {
    expect(startChapterFor('towards')).toBe(1);
    expect(startChapterFor('expected')).toBe(3);
    expect(startChapterFor('higher')).toBe(4);
  });
});

describe('trial timing', () => {
  it('gives each question real-paper time at a gentle pace, more with extra time, none with no timer', () => {
    // Arithmetic: 45 s per mark × 1.5 = 67.5 s for a 1-mark question.
    expect(placementItemMs('arithmetic', 1, 'standard')).toBe(67_500);
    expect(placementItemMs('arithmetic', 2, 'standard')).toBe(135_000);
    expect(placementItemMs('arithmetic', 1, 'extra')).toBe(84_375);
    expect(placementItemMs('arithmetic', 1, 'off')).toBeNull();
  });
});
