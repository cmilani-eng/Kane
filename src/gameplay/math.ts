import type { Vec2 } from './types';

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function moveToward(
  x: number,
  y: number,
  tx: number,
  ty: number,
  speed: number,
  dt: number,
): Vec2 {
  const d = dist(x, y, tx, ty);
  if (d < 1) return { x: tx, y: ty };
  const step = Math.min(d, speed * dt);
  return { x: x + ((tx - x) / d) * step, y: y + ((ty - y) / d) * step };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
