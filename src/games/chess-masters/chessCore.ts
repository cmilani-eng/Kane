/**
 * Chess Masters — board primitives: pieces, squares, the position and FEN.
 * Pure: no Phaser and no DOM. Everything a position needs travels inside it as plain data, so a
 * move can be tried on a copy and thrown away, and a whole position can be sent to a Web Worker.
 *
 * Called by: the other src/games/chess-masters modules.
 * Tested by: src/games/chess-masters/chessRules.test.ts
 */
export type Color = 0 | 1;
export const WHITE: Color = 0;
export const BLACK: Color = 1;
export const otherColor = (color: Color): Color => (color === WHITE ? BLACK : WHITE);

export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;
export type PieceType = 1 | 2 | 3 | 4 | 5 | 6;
export const PROMOTION_TYPES: readonly PieceType[] = [QUEEN, ROOK, BISHOP, KNIGHT];

/*
 * A piece is one integer, so its status moves with it:
 * bits 0-2 type, bit 3 colour, bits 4-5 shield turns left, bit 6 frozen. 0 is an empty square.
 */
export const EMPTY = 0;
export const makePiece = (color: Color, type: PieceType): number => type | (color << 3);
export const typeOf = (piece: number): PieceType => (piece & 7) as PieceType;
export const colorOf = (piece: number): Color => ((piece >> 3) & 1) as Color;
export const shieldTurns = (piece: number): number => (piece >> 4) & 3;
export const setShield = (piece: number, turns: number): number => (piece & ~48) | (turns << 4);
export const isFrozen = (piece: number): boolean => (piece & 64) !== 0;
export const setFrozen = (piece: number, frozen: boolean): number => (frozen ? piece | 64 : piece & ~64);

/** Squares are 0..63: a1 is 0, h1 is 7, a8 is 56. */
export const fileOf = (square: number): number => square & 7;
export const rankOf = (square: number): number => square >> 3;
export const squareAt = (file: number, rank: number): number => rank * 8 + file;
export const squareName = (square: number): string => `${'abcdefgh'[fileOf(square)]}${rankOf(square) + 1}`;

export function parseSquare(name: string): number {
  const file = name.charCodeAt(0) - 97;
  const rank = Number(name.slice(1)) - 1;
  if (name.length !== 2 || file < 0 || file > 7 || !Number.isInteger(rank) || rank < 0 || rank > 7) {
    throw new Error(`Not a square: ${name}`);
  }
  return squareAt(file, rank);
}

export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

export const POWER_KINDS = ['shield', 'freeze', 'double', 'teleport'] as const;
export type PowerKind = (typeof POWER_KINDS)[number];
export type Inventory = Readonly<Record<PowerKind, number>>;
export const emptyInventory = (): Inventory => ({ shield: 0, freeze: 0, double: 0, teleport: 0 });

/** Collectables lying on the board: square → kind. They never block a piece. */
export type Pickups = Readonly<Record<number, PowerKind>>;

export interface Position {
  /** 64 piece integers. Never changed once the position is handed out. */
  board: number[];
  turn: Color;
  castling: number;
  /** The square a pawn may be captured on en passant, or -1. */
  ep: number;
  /** Plies since the last capture or pawn move (the 50-move rule). */
  halfmove: number;
  fullmove: number;
  /** Where each king stands: [white, black]. */
  kings: [number, number];
  /** Upgrade ability bits for [white, black]; see chessUpgrades.ts. */
  upgrades: [number, number];
  /** Power-ups each side is holding: [white, black]. */
  held: [Inventory, Inventory];
  pickups: Pickups;
  /** True between the two halves of a Double Move. */
  second: boolean;
}

export type MoveFlag = 'ep' | 'castle' | 'push2';

export interface MoveAction {
  type: 'move';
  from: number;
  to: number;
  promo?: PieceType;
  flag?: MoveFlag;
  /** The first half of a Double Move: playing it spends the power-up. */
  double?: boolean;
}

export type Action =
  | MoveAction
  | { type: 'shield'; target: number }
  | { type: 'freeze'; target: number }
  | { type: 'teleport'; from: number; to: number };

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const FEN_PIECES = 'pnbrqk';

export function parseFen(fen: string, upgrades: [number, number] = [0, 0]): Position {
  const [placement = '', turn = 'w', castling = '-', ep = '-', halfmove = '0', fullmove = '1'] = fen.trim().split(/\s+/);
  const rows = placement.split('/');
  if (rows.length !== 8) throw new Error(`Bad FEN: ${fen}`);
  const board = new Array<number>(64).fill(EMPTY);
  const kings: [number, number] = [-1, -1];
  rows.forEach((row, i) => {
    let file = 0;
    for (const char of row) {
      if (char >= '1' && char <= '8') {
        file += Number(char);
        continue;
      }
      const type = FEN_PIECES.indexOf(char.toLowerCase()) + 1;
      if (type === 0 || file > 7) throw new Error(`Bad FEN: ${fen}`);
      const color: Color = char === char.toLowerCase() ? BLACK : WHITE;
      const square = squareAt(file, 7 - i);
      board[square] = makePiece(color, type as PieceType);
      if (type === KING) kings[color] = square;
      file++;
    }
    if (file !== 8) throw new Error(`Bad FEN: ${fen}`);
  });
  if (kings[0] < 0 || kings[1] < 0) throw new Error(`Both kings are needed: ${fen}`);

  let rights = 0;
  if (castling.includes('K')) rights |= CASTLE_WK;
  if (castling.includes('Q')) rights |= CASTLE_WQ;
  if (castling.includes('k')) rights |= CASTLE_BK;
  if (castling.includes('q')) rights |= CASTLE_BQ;

  return {
    board,
    turn: turn === 'b' ? BLACK : WHITE,
    castling: rights,
    ep: ep === '-' ? -1 : parseSquare(ep),
    halfmove: Number(halfmove),
    fullmove: Number(fullmove),
    kings,
    upgrades: [upgrades[0], upgrades[1]],
    held: [emptyInventory(), emptyInventory()],
    pickups: {},
    second: false,
  };
}

export function startPosition(upgrades: [number, number] = [0, 0]): Position {
  return parseFen(START_FEN, upgrades);
}
