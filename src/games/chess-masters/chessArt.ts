/**
 * Chess Masters — all the drawing, on a 2D canvas: the board and its markers, the pieces, the
 * power-up orbs and the status badges. The scene shows the result as a texture.
 *
 * Markers: a gold wash for the last move and the chosen piece, a dot for a move, a ring for a
 * capture, a dashed ring for a power-up target, a red glow under a king in check, a gold
 * hexagon (with turns left) on a shielded piece, ice on a frozen one and a star on an upgraded
 * one.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts, chessHud.ts
 * Tested by: src/games/chess-masters/chessArt.test.ts
 */
import {
  colorOf,
  fileOf,
  isFrozen,
  rankOf,
  shieldTurns,
  typeOf,
  type Color,
  type PieceType,
  type Position,
  type PowerKind,
} from './chessCore';
import { PIECE_SHAPES } from './chessPieceShapes';
import { squareOrigin } from './chessLayout';
import type { TargetKind } from './chessSelection';
import { abilitiesOfPiece } from './chessUpgrades';

type Ctx = CanvasRenderingContext2D;

export const BOARD_LIGHT = '#e6edf8';
export const BOARD_DARK = '#6f8fbe';
const GOLD = '#ffd23f';
const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

export const POWER_COLORS: Readonly<Record<PowerKind, string>> = {
  shield: '#f2a91d',
  freeze: '#23b5e8',
  double: '#ef4fa8',
  teleport: '#8a63f2',
};

const PIECE_PAINT = [
  { top: '#fffdf6', bottom: '#d9c9a8', edge: '#2c2238', detail: '#2c2238' },
  { top: '#514b72', bottom: '#191529', edge: '#08060f', detail: '#d9d2ff' },
] as const;

/** Draw one piece into the square box whose top-left corner is (x, y). */
export function drawPiece(ctx: Ctx, type: PieceType, color: Color, x: number, y: number, size: number): void {
  const shape = PIECE_SHAPES[type];
  const paint = PIECE_PAINT[color];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);

  ctx.fillStyle = 'rgba(8, 14, 30, 0.28)';
  ctx.beginPath();
  ctx.ellipse(50, 91, 31, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createLinearGradient(0, 8, 0, 92);
  body.addColorStop(0, paint.top);
  body.addColorStop(1, paint.bottom);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const d of shape.parts) {
    const path = new Path2D(d);
    ctx.fillStyle = body;
    ctx.fill(path);
    ctx.strokeStyle = paint.edge;
    ctx.lineWidth = 3.4;
    ctx.stroke(path);
  }
  ctx.strokeStyle = paint.detail;
  ctx.lineWidth = 2.6;
  for (const d of shape.lines ?? []) ctx.stroke(new Path2D(d));
  ctx.fillStyle = paint.detail;
  for (const [cx, cy, r] of shape.dots ?? []) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The sign for a power-up, centred at (cx, cy) and about 2r across. */
export function drawPowerSign(ctx: Ctx, kind: PowerKind, cx: number, cy: number, r: number, color = '#ffffff'): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(r / 10, r / 10);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'shield') {
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(8, -5.5);
    ctx.bezierCurveTo(8, 2, 5, 6.5, 0, 9.5);
    ctx.bezierCurveTo(-5, 6.5, -8, 2, -8, -5.5);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'freeze') {
    for (let arm = 0; arm < 6; arm++) {
      ctx.save();
      ctx.rotate((arm * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -9);
      ctx.moveTo(-2.8, -8);
      ctx.lineTo(0, -5.5);
      ctx.lineTo(2.8, -8);
      ctx.stroke();
      ctx.restore();
    }
  } else if (kind === 'double') {
    ctx.lineWidth = 3.2;
    for (const dx of [-5.5, 2.5]) {
      ctx.beginPath();
      ctx.moveTo(dx - 1.5, -6.5);
      ctx.lineTo(dx + 4.5, 0);
      ctx.lineTo(dx - 1.5, 6.5);
      ctx.stroke();
    }
  } else {
    // Two arrows chasing each other round a circle.
    for (const turn of [0, Math.PI]) {
      ctx.save();
      ctx.rotate(turn);
      ctx.beginPath();
      ctx.arc(0, 0, 6.8, Math.PI * 0.95, Math.PI * 1.72);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8.8, -3.6);
      ctx.lineTo(2.2, -9);
      ctx.lineTo(1.6, -2.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A glowing orb with a power-up's sign: what lies on the board and sits on the buttons. */
export function drawPowerOrb(ctx: Ctx, kind: PowerKind, cx: number, cy: number, r: number): void {
  const color = POWER_COLORS[kind];
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.35);
  glow.addColorStop(0, `${color}aa`);
  glow.addColorStop(1, `${color}00`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
  ctx.restore();
  drawPowerSign(ctx, kind, cx, cy, r * 0.66);
}

function drawStar(ctx: Ctx, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const reach = i % 2 === 0 ? r : r * 0.5;
    ctx.lineTo(cx + Math.cos(angle) * reach, cy + Math.sin(angle) * reach);
  }
  ctx.closePath();
}

function badge(ctx: Ctx, cx: number, cy: number, r: number, fill: string, text: string, ink: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b1830';
  ctx.lineWidth = Math.max(1, r * 0.18);
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = `900 ${Math.round(r * 1.35)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + r * 0.08);
}

/** A piece with everything that marks its state: shield, ice and upgrade star. */
export function drawBoardPiece(ctx: Ctx, piece: number, upgrades: number, x: number, y: number, cell: number): void {
  const type = typeOf(piece);
  const color = colorOf(piece);
  drawPiece(ctx, type, color, x + cell * 0.03, y + cell * 0.02, cell * 0.94);

  const turns = shieldTurns(piece);
  if (turns > 0) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2;
      ctx.lineTo(x + cell / 2 + Math.cos(angle) * cell * 0.48, y + cell / 2 + Math.sin(angle) * cell * 0.48);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 196, 46, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#e89a0c';
    ctx.lineWidth = Math.max(2, cell * 0.055);
    ctx.stroke();
    ctx.restore();
    badge(ctx, x + cell * 0.8, y + cell * 0.2, cell * 0.14, GOLD, String(turns), '#2b1a00');
  }

  if (isFrozen(piece)) {
    ctx.save();
    ctx.fillStyle = 'rgba(148, 226, 255, 0.5)';
    ctx.strokeStyle = 'rgba(232, 250, 255, 0.95)';
    ctx.lineWidth = Math.max(1.5, cell * 0.045);
    ctx.beginPath();
    ctx.roundRect(x + cell * 0.07, y + cell * 0.07, cell * 0.86, cell * 0.86, cell * 0.16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawPowerOrb(ctx, 'freeze', x + cell * 0.22, y + cell * 0.23, cell * 0.14);
  }

  const extras = abilitiesOfPiece(upgrades, type).length;
  if (extras > 0) {
    const cx = x + cell * 0.8;
    const cy = y + cell * 0.8;
    drawStar(ctx, cx, cy, cell * 0.17);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.strokeStyle = '#3a2600';
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.stroke();
    if (extras > 1) {
      ctx.fillStyle = '#2b1a00';
      ctx.font = `900 ${Math.round(cell * 0.15)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(extras), cx, cy + cell * 0.01);
    }
  }
}

export interface BoardView {
  pos: Position;
  flipped: boolean;
  selected: number;
  /** Squares the player may tap next. */
  targets: ReadonlyMap<number, TargetKind>;
  powerKind: PowerKind | null;
  lastSquares: readonly number[];
  /** The square of a king in check, or -1. */
  checkSquare: number;
  /** A piece on its way: drawn part of the way from one square to another. */
  slide: { from: number; to: number; progress: number } | null;
}

export function drawBoard(ctx: Ctx, size: number, view: BoardView): void {
  const { pos, flipped } = view;
  const cell = size / 8;
  const at = (square: number): { x: number; y: number } => squareOrigin(square, size, flipped);
  ctx.clearRect(0, 0, size, size);

  for (let square = 0; square < 64; square++) {
    const { x, y } = at(square);
    const dark = (fileOf(square) + rankOf(square)) % 2 === 0;
    ctx.fillStyle = dark ? BOARD_DARK : BOARD_LIGHT;
    // A hair of overlap so no seams show between squares at odd sizes.
    ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
  }
  const wash = (square: number, color: string): void => {
    const { x, y } = at(square);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, cell, cell);
  };
  for (const square of view.lastSquares) wash(square, 'rgba(255, 204, 51, 0.4)');
  if (view.selected >= 0) wash(view.selected, 'rgba(255, 190, 20, 0.62)');

  if (view.checkSquare >= 0) {
    const { x, y } = at(view.checkSquare);
    const glow = ctx.createRadialGradient(x + cell / 2, y + cell / 2, 0, x + cell / 2, y + cell / 2, cell * 0.72);
    glow.addColorStop(0, 'rgba(255, 30, 45, 0.95)');
    glow.addColorStop(0.55, 'rgba(255, 40, 55, 0.65)');
    glow.addColorStop(1, 'rgba(255, 40, 55, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, cell, cell);
  }

  // Coordinates along the left and bottom edges.
  ctx.font = `800 ${Math.max(9, Math.round(cell * 0.17))}px ${FONT}`;
  for (let i = 0; i < 8; i++) {
    const file = flipped ? 7 - i : i;
    const rank = flipped ? i : 7 - i;
    ctx.fillStyle = (file + (flipped ? 7 : 0)) % 2 === 0 ? BOARD_LIGHT : '#43618f';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('abcdefgh'[file]!, (i + 1) * cell - cell * 0.06, size - cell * 0.06);
    ctx.fillStyle = (rank + (flipped ? 7 : 0)) % 2 === 0 ? BOARD_LIGHT : '#43618f';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(rank + 1), cell * 0.06, i * cell + cell * 0.06);
  }

  for (const [key, kind] of Object.entries(pos.pickups)) {
    const { x, y } = at(Number(key));
    drawPowerOrb(ctx, kind, x + cell / 2, y + cell / 2, cell * 0.28);
  }

  for (let square = 0; square < 64; square++) {
    const piece = pos.board[square]!;
    if (!piece || view.slide?.to === square) continue;
    const { x, y } = at(square);
    drawBoardPiece(ctx, piece, pos.upgrades[colorOf(piece)], x, y, cell);
  }

  for (const [square, kind] of view.targets) {
    const { x, y } = at(square);
    const cx = x + cell / 2;
    const cy = y + cell / 2;
    ctx.save();
    if (kind === 'power') {
      ctx.strokeStyle = view.powerKind ? POWER_COLORS[view.powerKind] : GOLD;
      ctx.lineWidth = Math.max(2, cell * 0.075);
      ctx.setLineDash([cell * 0.17, cell * 0.1]);
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (pos.board[square] || (square === pos.ep && typeOf(pos.board[view.selected] ?? 0) === 1)) {
      ctx.strokeStyle = 'rgba(10, 24, 52, 0.62)';
      ctx.lineWidth = Math.max(2, cell * 0.085);
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.43, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(10, 24, 52, 0.44)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = Math.max(1, cell * 0.03);
      ctx.beginPath();
      // A move onto a power-up keeps the orb visible: the dot moves to the corner.
      const onPickup = pos.pickups[square] !== undefined;
      ctx.arc(onPickup ? x + cell * 0.82 : cx, onPickup ? y + cell * 0.18 : cy, cell * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  if (view.slide) {
    const piece = pos.board[view.slide.to]!;
    if (piece) {
      const a = at(view.slide.from);
      const b = at(view.slide.to);
      const t = 1 - (1 - Math.min(1, Math.max(0, view.slide.progress))) ** 3;
      drawBoardPiece(ctx, piece, pos.upgrades[colorOf(piece)], a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, cell);
    }
  }
}
