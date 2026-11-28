/**
 * Chess Masters — saved progress (upgrade points, bought upgrades, results against the computer
 * and the last choices) in localStorage, as one JSON value under `kane.chessMasters.v1` like the
 * other games. Everything read back is checked, so a hand-edited or older value can never break
 * the game. Two-player games never read or change the upgrades here.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts
 * Tested by: src/games/chess-masters/chessStore.test.ts
 */
import type { PieceType } from './chessCore';
import { TIME_CONTROLS, type TimeControlId } from './chessClock';
import type { Mode } from './chessMatch';
import {
  LEVELS,
  START_POINTS,
  UPGRADE_IDS,
  costOf,
  pickUpgrade,
  pointsEarned,
  type Level,
  type UpgradeId,
} from './chessUpgrades';

export const STORAGE_KEY = 'kane.chessMasters.v1';
const MAX_POINTS = 9999;

export type PlayAs = 'white' | 'black';

export interface Progress {
  /** Points not yet spent in the Workshop. */
  points: number;
  owned: UpgradeId[];
  /** Results against the computer, all modes. */
  wins: number;
  losses: number;
  draws: number;
  playAs: PlayAs;
  blitz: TimeControlId;
  /** The level last played, which Enter picks again. */
  level: Level;
}

export type GameResult = 'win' | 'draw' | 'loss';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function emptyProgress(): Progress {
  return { points: START_POINTS, owned: [], wins: 0, losses: 0, draws: 0, playAs: 'white', blitz: '3+2', level: 'easy' };
}

function deviceStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const wholeNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(MAX_POINTS, Math.floor(value)) : fallback;

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

function clean(raw: unknown): Progress {
  const empty = emptyProgress();
  if (!raw || typeof raw !== 'object') return empty;
  const r = raw as Record<string, unknown>;
  const owned = Array.isArray(r.owned) ? r.owned : [];
  return {
    points: wholeNumber(r.points, empty.points),
    owned: UPGRADE_IDS.filter((id) => owned.includes(id)),
    wins: wholeNumber(r.wins, 0),
    losses: wholeNumber(r.losses, 0),
    draws: wholeNumber(r.draws, 0),
    playAs: oneOf<PlayAs>(r.playAs, ['white', 'black'], empty.playAs),
    blitz: oneOf(r.blitz, TIME_CONTROLS, empty.blitz),
    level: oneOf(r.level, LEVELS, empty.level),
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

export function buyUpgrade(progress: Progress, id: UpgradeId): { progress: Progress; result: 'bought' | 'owned' | 'short' } {
  const { picks, points, result } = pickUpgrade(progress.owned, progress.points, id);
  return { progress: { ...progress, owned: picks, points }, result };
}

/** Give every upgrade back for its full price, to try a different set. */
export function refundUpgrades(progress: Progress): Progress {
  return { ...progress, owned: [], points: Math.min(MAX_POINTS, progress.points + costOf(progress.owned)) };
}

/** Record a game against the computer. Only Upgrades games earn points. */
export function finishGame(
  progress: Progress,
  game: { mode: Mode; level: Level; result: GameResult; captured: readonly PieceType[] },
): { progress: Progress; earned: number } {
  const earned = game.mode === 'upgrades' ? pointsEarned(game.captured, game.result, game.level) : 0;
  return {
    progress: {
      ...progress,
      points: Math.min(MAX_POINTS, progress.points + earned),
      wins: progress.wins + (game.result === 'win' ? 1 : 0),
      losses: progress.losses + (game.result === 'loss' ? 1 : 0),
      draws: progress.draws + (game.result === 'draw' ? 1 : 0),
    },
    earned,
  };
}
