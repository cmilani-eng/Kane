/** Upgrade prices, points and the computer keeping pace with the player. */
import { describe, expect, it } from 'vitest';
import { KING } from './chessCore';
import {
  ABILITY,
  DRAFT_BUDGET,
  LEVELS,
  START_POINTS,
  UPGRADES,
  UPGRADE_IDS,
  abilitiesOfPiece,
  computerBudget,
  computerUpgrades,
  costOf,
  idsOf,
  maskOf,
  pickUpgrade,
  pointsEarned,
} from './chessUpgrades';

const EVERYTHING = costOf(UPGRADE_IDS);

describe('the upgrade list', () => {
  it('gives every ability its own bit, and none to the king', () => {
    expect(new Set(Object.values(ABILITY)).size).toBe(UPGRADES.length);
    expect(UPGRADES.every((u) => u.piece !== KING)).toBe(true);
    expect(UPGRADES.map((u) => u.id)).toEqual(Object.keys(ABILITY));
  });

  it('turns lists into masks and back', () => {
    expect(idsOf(maskOf(['tunnel', 'trot']))).toEqual(['trot', 'tunnel']);
    expect(abilitiesOfPiece(maskOf(['tunnel', 'trot', 'longLeap']), 2)).toEqual(['trot', 'longLeap']);
  });

  it('lets a new player and a two-player draft buy something', () => {
    const cheapest = Math.min(...UPGRADES.map((u) => u.cost));
    expect(START_POINTS).toBeGreaterThanOrEqual(cheapest);
    expect(DRAFT_BUDGET).toBeGreaterThanOrEqual(cheapest * 2);
  });
});

describe('buying', () => {
  it('spends points once, and refuses when short', () => {
    const bought = pickUpgrade([], 5, 'longLeap');
    expect(bought).toEqual({ picks: ['longLeap'], points: 1, result: 'bought' });
    expect(pickUpgrade(bought.picks, 1, 'longLeap').result).toBe('owned');
    expect(pickUpgrade(bought.picks, 1, 'amazon')).toEqual({ picks: ['longLeap'], points: 1, result: 'short' });
  });
});

describe('the computer keeps pace with the player', () => {
  it('gets more as the level rises, and never less than the player on Medium and Hard', () => {
    for (let value = 0; value <= EVERYTHING; value++) {
      const [easy, medium, hard] = LEVELS.map((level) => computerBudget(level, value));
      expect(easy).toBeLessThanOrEqual(medium!);
      expect(medium).toBe(value);
      expect(hard).toBeGreaterThan(value);
    }
  });

  it('spends as much of its budget as the prices allow', () => {
    for (const level of LEVELS) {
      for (let value = 0; value <= EVERYTHING; value += 3) {
        const spend = costOf(computerUpgrades(level, value, 11));
        const budget = Math.min(computerBudget(level, value), EVERYTHING);
        expect(spend).toBeLessThanOrEqual(budget);
        expect(budget - spend).toBeLessThanOrEqual(2);
      }
    }
  });

  it('matches a player who owns everything', () => {
    expect(computerUpgrades('medium', EVERYTHING, 1)).toEqual([...UPGRADE_IDS]);
  });

  it('is repeatable from a seed and varies between seeds', () => {
    expect(computerUpgrades('medium', 12, 5)).toEqual(computerUpgrades('medium', 12, 5));
    const sets = new Set(Array.from({ length: 20 }, (_, seed) => computerUpgrades('medium', 12, seed).join()));
    expect(sets.size).toBeGreaterThan(1);
  });
});

describe('points from a game', () => {
  it('pays for captures whatever the result, and a bonus for winning or drawing', () => {
    expect(pointsEarned([1, 2, 5], 'loss', 'hard')).toBe(1 + 2 + 5);
    expect(pointsEarned([1], 'win', 'easy')).toBe(5);
    expect(pointsEarned([], 'win', 'hard')).toBeGreaterThan(pointsEarned([], 'win', 'medium'));
    expect(pointsEarned([], 'draw', 'medium')).toBeLessThan(pointsEarned([], 'win', 'medium'));
  });
});
