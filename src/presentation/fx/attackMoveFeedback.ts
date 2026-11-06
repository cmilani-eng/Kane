/**
 * Attack-move armed feedback — screen tint + ground reticle.
 * Readable on desktop cursor and mobile touch.
 */
import type Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics;

const TINT = 0xe85a5a;
const RING = 0xf0c75e;

/** Soft full-screen wash while A-move is armed (draw on scrollFactor-0 gfx). */
export function drawAttackMoveScreenTint(
  g: G,
  width: number,
  height: number,
  timeMs: number,
): void {
  const pulse = 0.06 + 0.03 * Math.sin(timeMs / 220);
  g.clear();
  g.fillStyle(TINT, pulse);
  g.fillRect(0, 0, width, height);
  // Corner chevrons — mode chrome without blocking the map
  const c = 18;
  const m = 10;
  g.lineStyle(3, TINT, 0.55 + pulse * 2);
  // TL
  g.lineBetween(m, m + c, m, m);
  g.lineBetween(m, m, m + c, m);
  // TR
  g.lineBetween(width - m - c, m, width - m, m);
  g.lineBetween(width - m, m, width - m, m + c);
  // BL
  g.lineBetween(m, height - m - c, m, height - m);
  g.lineBetween(m, height - m, m + c, height - m);
  // BR
  g.lineBetween(width - m - c, height - m, width - m, height - m);
  g.lineBetween(width - m, height - m, width - m, height - m - c);
}

/** World-space reticle under the pointer / last touch. */
export function drawAttackMoveReticle(
  g: G,
  x: number,
  y: number,
  timeMs: number,
): void {
  g.clear();
  const throb = 1 + 0.08 * Math.sin(timeMs / 120);
  const r = 16 * throb;

  g.fillStyle(TINT, 0.18);
  g.fillCircle(x, y, r * 1.35);
  g.lineStyle(2.5, TINT, 0.95);
  g.strokeCircle(x, y, r);
  g.lineStyle(1.5, RING, 0.85);
  g.strokeCircle(x, y, r * 0.55);

  // Crosshair ticks
  const tick = 8;
  g.lineStyle(2.2, RING, 0.95);
  g.lineBetween(x - r - 4, y, x - r + tick, y);
  g.lineBetween(x + r - tick, y, x + r + 4, y);
  g.lineBetween(x, y - r - 4, x, y - r + tick);
  g.lineBetween(x, y + r - tick, x, y + r + 4);

  // Sword tip (attack cue)
  g.fillStyle(TINT, 0.95);
  g.fillTriangle(x, y - r - 10, x + 5, y - r - 2, x - 5, y - r - 2);
}

/** CSS cursor while armed (desktop). Restore with `default` / empty. */
export function setAttackMoveCursor(
  canvas: HTMLCanvasElement | null,
  armed: boolean,
): void {
  if (!canvas) return;
  canvas.style.cursor = armed ? 'crosshair' : '';
}
