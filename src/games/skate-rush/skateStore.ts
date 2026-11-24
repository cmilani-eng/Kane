/**
 * Skate Rush 3 — saved progress (coin wallet, owned decks, top scores) in localStorage.
 * Stored as one JSON value under `kane.skateRush.v1`, like the other Kane prefs; everything read
 * back is validated, so a hand-edited or older value can never break the game.
 *
 * Called by: src/games/skate-rush/SkateRushScene.ts
 * Tested by: src/games/skate-rush/skateStore.test.ts
 */
import { BOARD_IDS, BOARD_PRICES, SKATERS, type BoardId, type SkaterId } from './skateRules';

export const STORAGE_KEY = 'kane.skateRush.v1';
export const MAX_LEADERS = 10;

export interface Leader {
  score: number;
  name: string;
}

export interface Progress {
  coins: number;
  /** Decks the player has bought. The Starter Deck is always owned. */
  owned: BoardId[];
  /** Best runs first, at most `MAX_LEADERS`. */
  leaders: Leader[];
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function emptyProgress(): Progress {
  return { coins: 0, owned: ['basic'], leaders: [] };
}

function deviceStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const isBoard = (v: unknown): v is BoardId => typeof v === 'string' && (BOARD_IDS as readonly string[]).includes(v);

const wholeNumber = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null;

function clean(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object') return emptyProgress();
  const r = raw as Record<string, unknown>;

  const owned = new Set<BoardId>(['basic']);
  if (Array.isArray(r.owned)) for (const b of r.owned) if (isBoard(b)) owned.add(b);

  const leaders: Leader[] = [];
  if (Array.isArray(r.leaders)) {
    for (const entry of r.leaders) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      const score = wholeNumber(e.score);
      if (score !== null && typeof e.name === 'string') leaders.push({ score, name: e.name.slice(0, 12) });
    }
  }
  leaders.sort((a, b) => b.score - a.score);

  return {
    coins: wholeNumber(r.coins) ?? 0,
    owned: BOARD_IDS.filter((b) => owned.has(b)),
    leaders: leaders.slice(0, MAX_LEADERS),
  };
}

export function loadProgress(storage: StorageLike | null = deviceStorage()): Progress {
  if (!storage) return emptyProgress();
  try {
    const text = storage.getItem(STORAGE_KEY);
    return text ? clean(JSON.parse(text)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: Progress, storage: StorageLike | null = deviceStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore quota / private mode: progress just will not persist
  }
}

export type PurchaseResult = 'bought' | 'owned' | 'short';

/** Buy a deck with wallet coins. An owned deck costs nothing; too few coins changes nothing. */
export function purchase(progress: Progress, board: BoardId): { progress: Progress; result: PurchaseResult } {
  if (progress.owned.includes(board)) return { progress, result: 'owned' };
  const price = BOARD_PRICES[board];
  if (progress.coins < price) return { progress, result: 'short' };
  return {
    progress: {
      ...progress,
      coins: progress.coins - price,
      owned: BOARD_IDS.filter((b) => b === board || progress.owned.includes(b)),
    },
    result: 'bought',
  };
}

/** Bank a finished run: its coins join the wallet and its score may enter the top scores. */
export function finishRun(progress: Progress, run: { score: number; coins: number; skater: SkaterId }): Progress {
  const leaders = [...progress.leaders, { score: Math.floor(run.score), name: SKATERS[run.skater].name }]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LEADERS);
  return { ...progress, coins: progress.coins + run.coins, leaders };
}
