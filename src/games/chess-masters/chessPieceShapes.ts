/**
 * Chess Masters — the original piece drawings, as SVG path data in a 100 × 100 box. The board
 * draws them with Path2D (never Unicode chess characters, which can turn into emoji or differ
 * between devices), and public/covers/chess-masters.svg uses the same shapes.
 *
 * Called by: src/games/chess-masters/chessArt.ts
 * Tested by: src/games/chess-masters/chessArt.test.ts
 */
import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK, type PieceType } from './chessCore';

export interface PieceShape {
  /** Filled and outlined, back to front. */
  parts: readonly string[];
  /** Thin lines drawn on top (a mane, a bishop's slit). */
  lines?: readonly string[];
  /** Small solid dots on top (eyes). */
  dots?: readonly (readonly [number, number, number])[];
}

const circle = (x: number, y: number, r: number): string =>
  `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

const PLINTH = 'M22 91 L22 84 Q22 79 28 79 L72 79 Q78 79 78 84 L78 91 Z';

export const PIECE_SHAPES: Readonly<Record<PieceType, PieceShape>> = {
  [PAWN]: {
    parts: [
      'M31 79 C37 69 43 62 43 51 L57 51 C57 62 63 69 69 79 Z',
      'M35 52 Q35 46 42 46 L58 46 Q65 46 65 52 Q58 56 50 56 Q42 56 35 52 Z',
      circle(50, 34, 13),
      PLINTH,
    ],
  },
  [KNIGHT]: {
    parts: [
      'M31 79 C30 66 38 58 49 51 C43 51 38 54 33 58 C28 62 20 57 20 51 C21 44 28 39 33 32 C36 27 39 23 43 21 L42 9 L53 18 C68 20 77 34 77 51 C77 63 70 70 71 79 Z',
      PLINTH,
    ],
    lines: ['M56 25 C66 32 69 46 64 61', 'M24 55 Q29 55 33 52'],
    dots: [
      [43, 32, 3.2],
      [26, 49, 1.8],
    ],
  },
  [BISHOP]: {
    parts: [
      'M33 79 C41 72 43 67 43 61 L57 61 C57 67 59 72 67 79 Z',
      'M36 62 Q36 56 43 56 L57 56 Q64 56 64 62 Z',
      'M50 19 C65 29 69 42 63 50 C61 54 58 55 58 57 L42 57 C42 55 39 54 37 50 C31 42 35 29 50 19 Z',
      circle(50, 14, 5.5),
      PLINTH,
    ],
    lines: ['M58 29 L47 42'],
  },
  [ROOK]: {
    parts: [
      'M31 79 L35 43 L65 43 L69 79 Z',
      'M28 37 L28 17 L38 17 L38 25 L45 25 L45 17 L55 17 L55 25 L62 25 L62 17 L72 17 L72 37 Z',
      'M28 46 L28 36 L72 36 L72 46 Z',
      PLINTH,
    ],
    lines: ['M35 70 L65 70'],
  },
  [QUEEN]: {
    parts: [
      'M30 79 C35 71 36 65 36 59 L64 59 C64 65 65 71 70 79 Z',
      'M35 60 L23 27 L39 45 L40 19 L50 42 L60 19 L61 45 L77 27 L65 60 Z',
      circle(23, 25, 5),
      circle(40, 17, 5),
      circle(60, 17, 5),
      circle(77, 25, 5),
      PLINTH,
    ],
    lines: ['M36 66 L64 66'],
  },
  [KING]: {
    parts: [
      'M30 79 C35 71 36 64 36 55 L64 55 C64 64 65 71 70 79 Z',
      'M46 6 L54 6 L54 13 L61 13 L61 21 L54 21 L54 38 L46 38 L46 21 L39 21 L39 13 L46 13 Z',
      'M36 57 C20 49 20 31 35 30 C42 30 48 34 50 40 C52 34 58 30 65 30 C80 31 80 49 64 57 Z',
      PLINTH,
    ],
    lines: ['M36 65 L64 65'],
  },
};
