import { describe, expect, it } from 'vitest';
import {
  pushStockIncomeSample,
  stockIncomePerMinute,
} from './stockIncome';

describe('stockIncomePerMinute', () => {
  it('scales deposits in the window to a per-minute rate', () => {
    const samples: { tMs: number; gold: number; crystals: number }[] = [];
    pushStockIncomeSample(samples, 10_000, 16, 0);
    pushStockIncomeSample(samples, 20_000, 16, 0);
    // 32 gold over 20s → 96/m
    expect(stockIncomePerMinute(samples, 20_000).gold).toBe(96);
    expect(stockIncomePerMinute(samples, 20_000).crystals).toBe(0);
  });

  it('drops samples older than the window', () => {
    const samples: { tMs: number; gold: number; crystals: number }[] = [];
    pushStockIncomeSample(samples, 0, 100, 0);
    pushStockIncomeSample(samples, 61_000, 8, 4);
    const rate = stockIncomePerMinute(samples, 61_000);
    // Only the fresh 8/4 remain inside the 60s window
    expect(rate.gold).toBe(8);
    expect(rate.crystals).toBe(4);
  });
});
