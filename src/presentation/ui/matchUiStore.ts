/**
 * Match stock shared by the Phaser battlefield and the HTML stock strip.
 * Gameplay stays Phaser-free: the scene publishes wallet changes, and the
 * Tailwind strip subscribes. Same shape as a tiny Zustand store.
 */
export interface MatchStock {
  gold: number;
  crystals: number;
  supply: number;
  supplyCap: number;
  /** Increments when gold is deposited, not when it is spent. */
  goldPickups: number;
  /** Increments when crystals are deposited, not when they are spent. */
  crystalPickups: number;
}

export type MatchStockListener = (stock: MatchStock) => void;

const empty = (): MatchStock => ({
  gold: 0,
  crystals: 0,
  supply: 0,
  supplyCap: 0,
  goldPickups: 0,
  crystalPickups: 0,
});

let stock: MatchStock = empty();
let hasBaseline = false;
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
}): void {
  const gold = Math.max(0, Math.floor(next.gold));
  const crystals = Math.max(0, Math.floor(next.crystals));
  const supply = Math.max(0, Math.floor(next.supply));
  const supplyCap = Math.max(0, Math.floor(next.supplyCap));
  if (
    gold === stock.gold &&
    crystals === stock.crystals &&
    supply === stock.supply &&
    supplyCap === stock.supplyCap
  ) {
    return;
  }
  stock = {
    gold,
    crystals,
    supply,
    supplyCap,
    goldPickups:
      hasBaseline && gold > stock.gold ? stock.goldPickups + 1 : stock.goldPickups,
    crystalPickups:
      hasBaseline && crystals > stock.crystals
        ? stock.crystalPickups + 1
        : stock.crystalPickups,
  };
  hasBaseline = true;
  for (const listener of listeners) listener(stock);
}

export function resetMatchStock(): void {
  stock = empty();
  hasBaseline = false;
  for (const listener of listeners) listener(stock);
}
