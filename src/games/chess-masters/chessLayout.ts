/**
 * Chess Masters — where everything goes on the screen, as pure numbers. A wide screen (laptop,
 * or a phone turned sideways) puts the board on the left with a side panel; a tall one (phone)
 * stacks the two player strips around the board with the controls underneath.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts, chessHud.ts
 * Tested by: src/games/chess-masters/chessLayout.test.ts
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChessLayout {
  wide: boolean;
  /** Always square. */
  board: Rect;
  /** The player at the top of the board, and the one at the bottom. */
  far: Rect;
  near: Rect;
  /** Whose turn, check, and what to do next. */
  status: Rect;
  /** Power-up buttons; null when the mode has none. */
  tray: Rect | null;
  /** Help, Flip and Menu. */
  buttons: Rect;
  /** What the tapped piece or power-up does. */
  info: Rect;
}

/** Room at the top for the "← Games" pill. */
const TOP_BAR = 50;
const GAP = 8;

export function chessLayout(width: number, height: number, hasTray: boolean): ChessLayout {
  return width >= 560 && width >= height * 1.15
    ? wideLayout(width, height, hasTray)
    : tallLayout(width, height, hasTray);
}

function wideLayout(width: number, height: number, hasTray: boolean): ChessLayout {
  const margin = width < 900 ? 10 : 20;
  const short = height < 520;
  const top = short ? 10 : TOP_BAR;
  // A short screen has no room above the board, so the board keeps clear of the pill sideways.
  const pillRoom = short ? 96 : 0;
  const sideW = Math.round(Math.min(360, Math.max(230, width * 0.27)));
  const side = Math.max(160, Math.floor(Math.min(height - top - margin, width - pillRoom - sideW - margin * 3)));
  const left = Math.max(pillRoom + margin, Math.round((width - side - margin - sideW) / 2));
  const boardY = top + Math.max(0, Math.round((height - top - margin - side) / 2));
  const board = { x: left, y: boardY, w: side, h: side };

  const x = left + side + margin;
  const card = side < 380 ? 42 : 58;
  const statusH = side < 380 ? 36 : 58;
  const trayH = hasTray ? (side < 380 ? 44 : Math.min(112, Math.round(side * 0.16))) : 0;
  const buttonsH = side < 380 ? 34 : 42;

  let y = boardY;
  const take = (h: number): Rect => {
    const rect = { x, y, w: sideW, h };
    y += h + GAP;
    return rect;
  };
  const far = take(card);
  const status = take(statusH);
  const tray = hasTray ? take(trayH) : null;
  const buttons = { x, y: boardY + side - card - GAP - buttonsH, w: sideW, h: buttonsH };
  const near = { x, y: boardY + side - card, w: sideW, h: card };
  const info = { x, y, w: sideW, h: Math.max(0, buttons.y - GAP - y) };
  return { wide: true, board, far, near, status, tray, buttons, info };
}

function tallLayout(width: number, height: number, hasTray: boolean): ChessLayout {
  const margin = 6;
  // A short phone trims the strips so the board stays big and the note below still shows.
  const short = height < 740;
  const topBar = short ? 46 : TOP_BAR;
  const gap = short ? 6 : GAP;
  const card = short ? 34 : 40;
  const statusH = short ? 34 : 40;
  const trayH = hasTray ? (short ? 46 : 50) : 0;
  const buttonsH = short ? 36 : 40;
  /** Room kept for the note about the tapped piece or power-up. */
  const infoH = 46;
  const fixed = topBar + card * 2 + statusH + (hasTray ? trayH + gap : 0) + buttonsH + gap * 2 + 8;
  const side = Math.max(160, Math.floor(Math.min(width - margin * 2, height - fixed - infoH - margin, 640)));
  const x = Math.round((width - side) / 2);

  let y = topBar;
  const take = (h: number, after = gap): Rect => {
    const rect = { x, y, w: side, h };
    y += h + after;
    return rect;
  };
  const far = take(card, 4);
  const board = take(side, 4);
  const near = take(card);
  const status = take(statusH, 2);
  const tray = hasTray ? take(trayH) : null;
  const buttons = take(buttonsH);
  const info = { x, y, w: side, h: Math.max(0, height - margin - y) };
  return { wide: false, board, far, near, status, tray, buttons, info };
}

/** The square under a point, or -1 when the point is off the board. */
export function squareFromPoint(board: Rect, px: number, py: number, flipped: boolean): number {
  const file = Math.floor(((px - board.x) / board.w) * 8);
  const row = Math.floor(((py - board.y) / board.h) * 8);
  if (file < 0 || file > 7 || row < 0 || row > 7) return -1;
  return flipped ? row * 8 + (7 - file) : (7 - row) * 8 + file;
}

/** The top-left corner of a square, in board pixels measured from the board's own corner. */
export function squareOrigin(square: number, size: number, flipped: boolean): { x: number; y: number } {
  const cell = size / 8;
  const file = square & 7;
  const rank = square >> 3;
  return { x: (flipped ? 7 - file : file) * cell, y: (flipped ? rank : 7 - rank) * cell };
}
