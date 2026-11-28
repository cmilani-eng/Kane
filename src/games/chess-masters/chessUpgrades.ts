/**
 * Chess Masters — piece upgrades: what each ability costs, how points are earned, and which
 * upgrades the computer takes. An upgrade belongs to a piece type and a side: all of that
 * side's knights (including a promoted one) get a knight upgrade. The king has none.
 * How each ability moves is in chessRules.ts. Every number here is a balance choice.
 *
 * Called by: chessRules.ts, chessAi.ts, chessMatch.ts, chessStore.ts, ChessMastersScene.ts
 * Tested by: src/games/chess-masters/chessUpgrades.test.ts
 */
import { BISHOP, KNIGHT, PAWN, QUEEN, ROOK, type PieceType } from './chessCore';
import { seededRandom } from './chessRandom';

export const ABILITY = {
  sidestep: 1,
  spearhead: 2,
  trot: 4,
  longLeap: 8,
  sideSlip: 16,
  vault: 32,
  cornerStep: 64,
  tunnel: 128,
  amazon: 256,
} as const;

export type UpgradeId = keyof typeof ABILITY;

export interface UpgradeDef {
  id: UpgradeId;
  piece: PieceType;
  /** Price in points. */
  cost: number;
  /** What the computer thinks each piece with it is worth extra, in hundredths of a pawn. */
  worth: number;
}

export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'sidestep', piece: PAWN, cost: 3, worth: 10 },
  { id: 'spearhead', piece: PAWN, cost: 5, worth: 25 },
  { id: 'trot', piece: KNIGHT, cost: 3, worth: 35 },
  { id: 'longLeap', piece: KNIGHT, cost: 4, worth: 70 },
  { id: 'sideSlip', piece: BISHOP, cost: 4, worth: 70 },
  { id: 'vault', piece: BISHOP, cost: 3, worth: 35 },
  { id: 'cornerStep', piece: ROOK, cost: 4, worth: 60 },
  { id: 'tunnel', piece: ROOK, cost: 5, worth: 70 },
  { id: 'amazon', piece: QUEEN, cost: 8, worth: 220 },
];

export const UPGRADE_IDS: readonly UpgradeId[] = UPGRADES.map((u) => u.id);

export const upgradeById = (id: UpgradeId): UpgradeDef => UPGRADES.find((u) => u.id === id) as UpgradeDef;
export const upgradesFor = (piece: PieceType): UpgradeDef[] => UPGRADES.filter((u) => u.piece === piece);
export const maskOf = (ids: readonly UpgradeId[]): number => ids.reduce((mask, id) => mask | ABILITY[id], 0);
export const idsOf = (mask: number): UpgradeId[] => UPGRADE_IDS.filter((id) => (mask & ABILITY[id]) !== 0);
export const costOf = (ids: readonly UpgradeId[]): number => ids.reduce((sum, id) => sum + upgradeById(id).cost, 0);
/** The abilities in `mask` that apply to one piece type. */
export const abilitiesOfPiece = (mask: number, piece: PieceType): UpgradeId[] =>
  upgradesFor(piece)
    .map((u) => u.id)
    .filter((id) => (mask & ABILITY[id]) !== 0);

export type Level = 'easy' | 'medium' | 'hard';
export const LEVELS: readonly Level[] = ['easy', 'medium', 'hard'];

/** Points a new player starts with, so the Workshop has something to offer on day one. */
export const START_POINTS = 6;
/** Two players: each side picks upgrades from the same budget. */
export const DRAFT_BUDGET = 10;

export const CAPTURE_POINTS: Readonly<Record<PieceType, number>> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 5, 6: 0 };
export const WIN_BONUS: Readonly<Record<Level, number>> = { easy: 4, medium: 8, hard: 12 };
export const DRAW_BONUS: Readonly<Record<Level, number>> = { easy: 1, medium: 3, hard: 5 };

/** What one finished game against the computer is worth to the player. */
export function pointsEarned(captured: readonly PieceType[], result: 'win' | 'draw' | 'loss', level: Level): number {
  const fromCaptures = captured.reduce((sum, type) => sum + CAPTURE_POINTS[type], 0);
  const bonus = result === 'win' ? WIN_BONUS[level] : result === 'draw' ? DRAW_BONUS[level] : 0;
  return fromCaptures + bonus;
}

/** How many points of upgrades the computer gets against a player who has spent `playerValue`. */
export function computerBudget(level: Level, playerValue: number): number {
  if (level === 'easy') return Math.floor(playerValue / 2);
  if (level === 'medium') return playerValue;
  return playerValue + 5;
}

/**
 * The computer's upgrades: the set that spends as much of its budget as possible, so it keeps
 * pace with the player however much they own. The seed picks between equally good sets.
 */
export function computerUpgrades(level: Level, playerValue: number, seed: number): UpgradeId[] {
  const budget = computerBudget(level, playerValue);
  let bestSpend = -1;
  let best: UpgradeId[][] = [];
  for (let subset = 0; subset < 1 << UPGRADE_IDS.length; subset++) {
    const ids = UPGRADE_IDS.filter((_, i) => (subset & (1 << i)) !== 0);
    const spend = costOf(ids);
    if (spend > budget || spend < bestSpend) continue;
    if (spend > bestSpend) best = [];
    bestSpend = spend;
    best.push(ids);
  }
  const random = seededRandom(seed);
  return best[Math.floor(random() * best.length)] ?? [];
}

/** Buy one upgrade out of a budget; a refusal leaves the picks unchanged. */
export function pickUpgrade(
  picks: readonly UpgradeId[],
  points: number,
  id: UpgradeId,
): { picks: UpgradeId[]; points: number; result: 'bought' | 'owned' | 'short' } {
  if (picks.includes(id)) return { picks: [...picks], points, result: 'owned' };
  const { cost } = upgradeById(id);
  if (points < cost) return { picks: [...picks], points, result: 'short' };
  return { picks: UPGRADE_IDS.filter((u) => u === id || picks.includes(u)), points: points - cost, result: 'bought' };
}
