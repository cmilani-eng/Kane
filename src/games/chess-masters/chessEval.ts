/**
 * Chess Masters — how the computer judges a position, in hundredths of a pawn: material
 * (upgrades included), where the pieces stand, pawn structure, king placement and the
 * power-ups in hand.
 *
 * Called by: src/games/chess-masters/chessAi.ts
 * Tested by: src/games/chess-masters/chessAi.test.ts
 */
import {
  BISHOP,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
  colorOf,
  fileOf,
  isFrozen,
  rankOf,
  typeOf,
  type Color,
  type Position,
  type PowerKind,
} from './chessCore';
import { ABILITY, UPGRADES } from './chessUpgrades';

/** Indexed by piece type. The king is never taken, so it has no material value. */
export const PIECE_VALUE: readonly number[] = [0, 100, 320, 330, 500, 900, 0];

/** What a power-up in hand is worth, so it is only spent for something better. */
const HELD_VALUE: Readonly<Record<PowerKind, number>> = { shield: 45, freeze: 60, double: 160, teleport: 90 };

const PASSED_BONUS: readonly number[] = [0, 5, 10, 20, 40, 70, 110, 0];
const ADVANCE_BONUS: readonly number[] = [0, 0, 4, 10, 18, 32, 55, 0];
/** Non-pawn material of both sides at the start, used to tell the middlegame from the endgame. */
const FULL_PHASE = 2 * (2 * 320 + 2 * 330 + 2 * 500 + 900);

/** What each of a side's pieces of every type is worth, with that side's upgrades. */
export function pieceValues(upgrades: number): number[] {
  const values = PIECE_VALUE.slice();
  for (const upgrade of UPGRADES) if (upgrades & ABILITY[upgrade.id]) values[upgrade.piece]! += upgrade.worth;
  return values;
}

/** 0 in a corner, 6 on the four middle squares. */
const centrality = (file: number, rank: number): number => Math.min(file, 7 - file) + Math.min(rank, 7 - rank);

function placement(type: number, file: number, rank: number, lateness: number): number {
  const centre = centrality(file, rank);
  switch (type) {
    case PAWN: {
      const middle = (file === 3 || file === 4) && rank >= 2 && rank <= 4 ? 14 : 0;
      return ADVANCE_BONUS[rank]! * (1 + lateness) + middle;
    }
    case KNIGHT:
      return (centre - 3) * 11 - (rank === 0 ? 12 : 0);
    case BISHOP:
      return (centre - 3) * 6 - (rank === 0 ? 12 : 0);
    case ROOK:
      return (rank === 6 ? 22 : 0) + (file === 3 || file === 4 ? 6 : 0);
    case QUEEN:
      return (centre - 3) * 3;
    default: {
      // The king hides behind its pawns early on and walks to the middle late.
      const sheltered = rank === 0 ? (file === 6 || file === 2 || file === 1 ? 30 : 0) : -18 - 12 * rank;
      return sheltered * (1 - lateness) + (centre - 3) * 12 * lateness;
    }
  }
}

/** The score from the point of view of the side to move. */
export function evaluate(pos: Position, values: readonly number[][]): number {
  const score = [0, 0];
  const pawnsOnFile = [new Array<number>(8).fill(0), new Array<number>(8).fill(0)];
  const pawns: [number[], number[]] = [[], []];
  const bishops = [0, 0];
  const material = [0, 0];
  let phase = 0;
  const { board } = pos;

  for (let square = 0; square < 64; square++) {
    const piece = board[square]!;
    if (!piece) continue;
    const type = typeOf(piece);
    const color = colorOf(piece);
    score[color]! += values[color]![type]!;
    material[color]! += values[color]![type]!;
    if (type === PAWN) {
      pawnsOnFile[color]![fileOf(square)]!++;
      pawns[color].push(square);
    } else if (type !== KING) {
      phase += PIECE_VALUE[type]!;
    }
    if (type === BISHOP) bishops[color]!++;
    if (isFrozen(piece)) score[color]! -= 15;
  }

  const lateness = 1 - Math.min(1, phase / FULL_PHASE);
  for (let square = 0; square < 64; square++) {
    const piece = board[square]!;
    if (!piece) continue;
    const color = colorOf(piece);
    const rank = color === WHITE ? rankOf(square) : 7 - rankOf(square);
    score[color]! += placement(typeOf(piece), fileOf(square), rank, lateness);
  }

  for (const color of [0, 1] as Color[]) {
    const enemy = 1 - color;
    if (bishops[color]! >= 2) score[color]! += 30;
    if (pos.castling & (color === WHITE ? 3 : 12)) score[color]! += 14;
    for (const square of pawns[color]) {
      const file = fileOf(square);
      const mine = pawnsOnFile[color]!;
      if (mine[file]! > 1) score[color]! -= 10;
      if (!mine[file - 1] && !mine[file + 1]) score[color]! -= 12;
      const passed = !pawns[enemy as Color].some((other) => {
        const ahead = color === WHITE ? rankOf(other) > rankOf(square) : rankOf(other) < rankOf(square);
        return ahead && Math.abs(fileOf(other) - file) <= 1;
      });
      if (passed) score[color]! += PASSED_BONUS[color === WHITE ? rankOf(square) : 7 - rankOf(square)]!;
    }
    for (const kind of ['shield', 'freeze', 'double', 'teleport'] as const) {
      score[color]! += pos.held[color][kind] * HELD_VALUE[kind];
    }
  }

  // With a big lead late on, drive the other king to the edge and bring your own up.
  const lead = material[0]! - material[1]!;
  if (lateness > 0.6 && Math.abs(lead) >= 300) {
    const winner = lead > 0 ? 0 : 1;
    const hunted = pos.kings[1 - winner]!;
    const hunter = pos.kings[winner]!;
    const apart = Math.abs(fileOf(hunted) - fileOf(hunter)) + Math.abs(rankOf(hunted) - rankOf(hunter));
    score[winner]! += (6 - centrality(fileOf(hunted), rankOf(hunted))) * 14 + (14 - apart) * 6;
  }

  const total = Math.round(score[0]! - score[1]!);
  return pos.turn === WHITE ? total : -total;
}
