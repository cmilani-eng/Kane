import { afterEach, describe, expect, it } from 'vitest';
import {
  getMatchStock,
  publishMatchStock,
  resetMatchStock,
  subscribeMatchStock,
} from './matchUiStore';

afterEach(() => {
  resetMatchStock();
});

describe('match stock store', () => {
  it('notifies the HTML subscriber when a deposit lands', () => {
    const seen: number[] = [];
    const unsub = subscribeMatchStock((stock) => seen.push(stock.gold));
    publishMatchStock({ gold: 220, crystals: 0, supply: 4, supplyCap: 36 });
    publishMatchStock({ gold: 228, crystals: 0, supply: 4, supplyCap: 36 });
    expect(seen).toEqual([0, 220, 228]);
    expect(getMatchStock().goldPickups).toBe(1);
    unsub();
  });

  it('does not count spending as a pickup', () => {
    publishMatchStock({ gold: 16, crystals: 4, supply: 4, supplyCap: 36 });
    publishMatchStock({ gold: 24, crystals: 4, supply: 4, supplyCap: 36 });
    publishMatchStock({ gold: 8, crystals: 4, supply: 4, supplyCap: 36 });
    expect(getMatchStock().goldPickups).toBe(1);
    expect(getMatchStock().crystalPickups).toBe(0);
  });

  it('ignores an unchanged wallet', () => {
    publishMatchStock({ gold: 8, crystals: 0, supply: 4, supplyCap: 36 });
    let calls = 0;
    const unsub = subscribeMatchStock(() => {
      calls += 1;
    });
    publishMatchStock({ gold: 8, crystals: 0, supply: 4, supplyCap: 36 });
    expect(calls).toBe(1);
    unsub();
  });
});
