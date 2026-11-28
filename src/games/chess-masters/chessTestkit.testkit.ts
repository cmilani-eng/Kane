/** Test helpers: build a position with statuses, power-ups and upgrades from a FEN. */
import {
  emptyInventory,
  parseFen,
  parseSquare,
  setFrozen,
  setShield,
  squareName,
  type Action,
  type Inventory,
  type PieceType,
  type Pickups,
  type Position,
  type PowerKind,
} from './chessCore';
import { legalActions, legalMoves } from './chessRules';
import { maskOf, type UpgradeId } from './chessUpgrades';

export const sq = parseSquare;

export interface SetUp {
  /** Upgrades for [white, black]. */
  upgrades?: [UpgradeId[], UpgradeId[]];
  /** Power-ups held by [white, black]. */
  held?: [Partial<Inventory>, Partial<Inventory>];
  /** Squares whose piece has a fresh shield. */
  shielded?: string[];
  frozen?: string[];
  pickups?: Record<string, PowerKind>;
}

export function position(fen: string, setUp: SetUp = {}): Position {
  const [white, black] = setUp.upgrades ?? [[], []];
  const pos = parseFen(fen, [maskOf(white), maskOf(black)]);
  for (const name of setUp.shielded ?? []) pos.board[sq(name)] = setShield(pos.board[sq(name)]!, 2);
  for (const name of setUp.frozen ?? []) pos.board[sq(name)] = setFrozen(pos.board[sq(name)]!, true);
  const [w, b] = setUp.held ?? [{}, {}];
  const pickups: Pickups = Object.fromEntries(Object.entries(setUp.pickups ?? {}).map(([n, k]) => [sq(n), k]));
  return { ...pos, held: [{ ...emptyInventory(), ...w }, { ...emptyInventory(), ...b }], pickups };
}

/** `move('e2', 'e4')`, with extras such as a promotion or the first half of a Double Move. */
export function move(from: string, to: string, extra: { promo?: PieceType; double?: boolean } = {}): Action {
  return { type: 'move', from: sq(from), to: sq(to), ...extra };
}

export const shield = (target: string): Action => ({ type: 'shield', target: sq(target) });
export const freeze = (target: string): Action => ({ type: 'freeze', target: sq(target) });
export const teleport = (from: string, to: string): Action => ({ type: 'teleport', from: sq(from), to: sq(to) });

export function describeAction(action: Action): string {
  if (action.type === 'move') return `${action.double ? 'double:' : ''}${squareName(action.from)}${squareName(action.to)}`;
  if (action.type === 'teleport') return `teleport:${squareName(action.from)}${squareName(action.to)}`;
  return `${action.type}:${squareName(action.target)}`;
}

/** Destinations of the legal moves of the piece on `from`, sorted. */
export function destinations(pos: Position, from: string): string[] {
  return [...new Set(legalMoves(pos).filter((m) => m.from === sq(from)).map((m) => squareName(m.to)))].sort();
}

export const actionNames = (pos: Position): string[] => legalActions(pos).map(describeAction);
