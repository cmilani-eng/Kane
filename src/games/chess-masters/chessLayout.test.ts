/** The board and its controls fit on a laptop and on a phone, without overlapping. */
import { describe, expect, it } from 'vitest';
import { chessLayout, squareFromPoint, squareOrigin, type Rect } from './chessLayout';

const SCREENS: [string, number, number][] = [
  ['16-inch laptop', 1728, 1000],
  ['15-inch laptop', 1440, 780],
  ['small laptop', 1280, 640],
  ['tablet upright', 768, 1024],
  ['phone', 375, 812],
  ['small phone', 375, 667],
  ['phone sideways', 812, 375],
  ['narrow phone', 320, 568],
];

const overlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('chessLayout', () => {
  it.each(SCREENS)('fits a %s (%i x %i)', (_name, width, height) => {
    for (const hasTray of [false, true]) {
      const layout = chessLayout(width, height, hasTray);
      const parts = [layout.board, layout.far, layout.near, layout.status, layout.buttons, ...(layout.tray ? [layout.tray] : [])];
      expect(layout.tray !== null).toBe(hasTray);
      expect(layout.board.w).toBe(layout.board.h);
      for (const rect of parts) {
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.w).toBeLessThanOrEqual(width);
        expect(rect.y + rect.h).toBeLessThanOrEqual(height);
      }
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          expect(overlap(parts[i]!, parts[j]!), `parts ${i} and ${j}`).toBe(false);
        }
      }
    }
  });

  it('gives a big board: nearly the width of a phone, most of the height of a laptop', () => {
    expect(chessLayout(375, 812, true).board.w).toBeGreaterThanOrEqual(360);
    expect(chessLayout(375, 667, true).board.w).toBeGreaterThanOrEqual(300);
    expect(chessLayout(1440, 780, true).board.w).toBeGreaterThanOrEqual(680);
    expect(chessLayout(375, 812, false).wide).toBe(false);
    expect(chessLayout(1440, 780, false).wide).toBe(true);
  });

  it('keeps room under the buttons on a phone for what the tapped piece does', () => {
    for (const [width, height] of [[375, 812], [375, 667], [390, 700]] as const) {
      for (const hasTray of [false, true]) expect(chessLayout(width, height, hasTray).info.h).toBeGreaterThanOrEqual(40);
    }
  });

  it('turns a point into a square, both ways up', () => {
    const board = { x: 100, y: 50, w: 400, h: 400 };
    expect(squareFromPoint(board, 101, 449, false)).toBe(0);
    expect(squareFromPoint(board, 499, 51, false)).toBe(63);
    expect(squareFromPoint(board, 101, 449, true)).toBe(63);
    expect(squareFromPoint(board, 99, 200, false)).toBe(-1);
    expect(squareFromPoint(board, 200, 451, false)).toBe(-1);
    for (const flipped of [false, true]) {
      for (let square = 0; square < 64; square++) {
        const at = squareOrigin(square, board.w, flipped);
        expect(squareFromPoint(board, board.x + at.x + 25, board.y + at.y + 25, flipped)).toBe(square);
      }
    }
  });
});
