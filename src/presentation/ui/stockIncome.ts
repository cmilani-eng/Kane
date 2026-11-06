/** Rolling deposit samples → gold/crystal income per minute for the stock strip. */

export const STOCK_INCOME_WINDOW_MS = 60_000;

export type StockIncomeSample = {
  tMs: number;
  gold: number;
  crystals: number;
};

export function pruneStockIncomeSamples(
  samples: StockIncomeSample[],
  nowMs: number,
  windowMs = STOCK_INCOME_WINDOW_MS,
): void {
  const cut = nowMs - windowMs;
  while (samples.length > 0 && samples[0]!.tMs < cut) {
    samples.shift();
  }
}

export function pushStockIncomeSample(
  samples: StockIncomeSample[],
  nowMs: number,
  goldDelta: number,
  crystalDelta: number,
  windowMs = STOCK_INCOME_WINDOW_MS,
): void {
  const gold = Math.max(0, Math.floor(goldDelta));
  const crystals = Math.max(0, Math.floor(crystalDelta));
  if (gold > 0 || crystals > 0) {
    samples.push({ tMs: nowMs, gold, crystals });
  }
  pruneStockIncomeSamples(samples, nowMs, windowMs);
}

/**
 * Extrapolate deposits in the rolling window to a per-minute rate.
 * Uses match elapsed (capped to the window) so early deposits don't 60× inflate.
 */
export function stockIncomePerMinute(
  samples: StockIncomeSample[],
  nowMs: number,
  windowMs = STOCK_INCOME_WINDOW_MS,
): { gold: number; crystals: number } {
  pruneStockIncomeSamples(samples, nowMs, windowMs);
  let gold = 0;
  let crystals = 0;
  for (const s of samples) {
    gold += s.gold;
    crystals += s.crystals;
  }
  const elapsedMs = Math.min(windowMs, Math.max(Math.floor(nowMs), 1));
  return {
    gold: Math.round((gold * 60_000) / elapsedMs),
    crystals: Math.round((crystals * 60_000) / elapsedMs),
  };
}
