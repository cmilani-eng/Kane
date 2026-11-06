/**
 * Match stock shared by the Phaser battlefield and the HTML stock strip.
 * Gameplay stays Phaser-free: the scene publishes wallet changes, and the
 * Tailwind strip subscribes. Same shape as a tiny Zustand store.
 */
import {
  pushStockIncomeSample,
  stockIncomePerMinute,
  type StockIncomeSample,
} from './stockIncome';

export interface MatchStock {
  gold: number;
  crystals: number;
  supply: number;
  supplyCap: number;
  /** Increments when gold is deposited, not when it is spent. */
  goldPickups: number;
  /** Increments when crystals are deposited, not when they are spent. */
  crystalPickups: number;
  /** Rolling gold income per minute (from deposits). */
  goldPerMin: number;
  /** Rolling crystal income per minute (from deposits). */
  crystalsPerMin: number;
}

export type MatchStockListener = (stock: MatchStock) => void;

const empty = (): MatchStock => ({
  gold: 0,
  crystals: 0,
  supply: 0,
  supplyCap: 0,
  goldPickups: 0,
  crystalPickups: 0,
  goldPerMin: 0,
  crystalsPerMin: 0,
});

let stock: MatchStock = empty();
let hasBaseline = false;
const incomeSamples: StockIncomeSample[] = [];
const listeners = new Set<MatchStockListener>();

export function getMatchStock(): MatchStock {
  return stock;
}

export function subscribeMatchStock(listener: MatchStockListener): () => void {
  listeners.add(listener);
  listener(stock);
  return () => {
    listeners.delete(listener);
  };
}

export function publishMatchStock(next: {
  gold: number;
  crystals: number;
  supply: number;
  supplyCap: number;
  /** Match elapsed ms — drives the income window. */
  nowMs?: number;
}): void {
  const gold = Math.max(0, Math.floor(next.gold));
  const crystals = Math.max(0, Math.floor(next.crystals));
  const supply = Math.max(0, Math.floor(next.supply));
  const supplyCap = Math.max(0, Math.floor(next.supplyCap));
  const nowMs = Math.max(0, Math.floor(next.nowMs ?? 0));

  const goldDelta = hasBaseline && gold > stock.gold ? gold - stock.gold : 0;
  const crystalDelta =
    hasBaseline && crystals > stock.crystals
      ? crystals - stock.crystals
      : 0;

  if (goldDelta > 0 || crystalDelta > 0) {
    pushStockIncomeSample(incomeSamples, nowMs, goldDelta, crystalDelta);
  }

  const rates = stockIncomePerMinute(incomeSamples, nowMs);

  if (
    gold === stock.gold &&
    crystals === stock.crystals &&
    supply === stock.supply &&
    supplyCap === stock.supplyCap &&
    rates.gold === stock.goldPerMin &&
    rates.crystals === stock.crystalsPerMin
  ) {
    return;
  }

  stock = {
    gold,
    crystals,
    supply,
    supplyCap,
    goldPickups:
      goldDelta > 0 ? stock.goldPickups + 1 : stock.goldPickups,
    crystalPickups:
      crystalDelta > 0 ? stock.crystalPickups + 1 : stock.crystalPickups,
    goldPerMin: rates.gold,
    crystalsPerMin: rates.crystals,
  };
  hasBaseline = true;
  for (const listener of listeners) listener(stock);
}

export function resetMatchStock(): void {
  stock = empty();
  hasBaseline = false;
  incomeSamples.length = 0;
  for (const listener of listeners) listener(stock);
}
