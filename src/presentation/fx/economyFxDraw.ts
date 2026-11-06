/**
 * Gather ticks + deposit pops — Gold / Crystal readable at phone distance.
 */
import type Phaser from 'phaser';
import type { EconomyFx } from '../../gameplay/battlefield/battlefieldEconomyFx';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

export function drawEconomyFxList(
  g: G,
  list: EconomyFx[],
  view?: ViewBounds | null,
): void {
  for (const fx of list) {
    if (view && !inView(view, fx.x, fx.y)) continue;
    const t = Math.max(0.05, fx.lifeMs / fx.maxLifeMs);
    if (fx.kind === 'gather') drawGatherTick(g, fx, t);
    else drawDepositPop(g, fx, t);
  }
}

/** Small rising tick / spark when a worker picks up resources. */
function drawGatherTick(g: G, fx: EconomyFx, t: number): void {
  const rise = (1 - t) * 18;
  const y = fx.y - rise;
  const a = t;
  const crystal = fx.resourceId === 'magic_crystals';

  g.fillStyle(fx.color, a * 0.9);
  if (crystal) {
    const s = 5 + (1 - t) * 3;
    g.fillTriangle(fx.x, y - s, fx.x + s * 0.7, y + s * 0.4, fx.x - s * 0.7, y + s * 0.4);
  } else {
    g.fillCircle(fx.x, y, 4 + (1 - t) * 2);
    g.fillStyle(0xfff8d8, a * 0.85);
    g.fillCircle(fx.x - 1.5, y - 2, 1.8);
  }

  // Tiny ground tick ring
  g.lineStyle(2, fx.color, a * 0.7);
  g.strokeCircle(fx.x, fx.y + 2, fx.radius * (0.55 + (1 - t) * 0.45));

  // Secondary spark
  const ang = (fx.seed % 7) * 0.9;
  const d = 8 + (1 - t) * 10;
  g.fillStyle(0xffffff, a * 0.75);
  g.fillCircle(fx.x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.4, 1.8);
}

/** Larger pop at stockpile when resources are banked. */
function drawDepositPop(g: G, fx: EconomyFx, t: number): void {
  const expand = 0.7 + (1 - t) * 1.1;
  const r = fx.radius * expand;
  const crystal = fx.resourceId === 'magic_crystals';
  const a = t;

  g.fillStyle(fx.color, a * 0.2);
  g.fillCircle(fx.x, fx.y, r * 0.55);
  g.lineStyle(3, fx.color, a);
  g.strokeCircle(fx.x, fx.y, r);
  g.lineStyle(1.5, 0xffffff, a * 0.65);
  g.strokeCircle(fx.x, fx.y, r * 0.55);

  if (crystal) {
    const s = 7 + (1 - t) * 5;
    g.fillStyle(0xcfe9ff, a * 0.95);
    g.fillTriangle(
      fx.x,
      fx.y - s - (1 - t) * 6,
      fx.x + s * 0.65,
      fx.y + s * 0.35,
      fx.x - s * 0.65,
      fx.y + s * 0.35,
    );
  } else {
    g.fillStyle(0xffe6a0, a * 0.95);
    g.fillCircle(fx.x, fx.y - (1 - t) * 8, 5 + (1 - t) * 2);
    g.fillStyle(0xfff8d8, a);
    g.fillCircle(fx.x - 1.5, fx.y - (1 - t) * 8 - 2, 2);
  }

  // 3 outward pips
  for (let i = 0; i < 3; i++) {
    const ang = ((fx.seed + i * 2.2) % 9) * 0.7;
    const d = r * (0.65 + (1 - t) * 0.5);
    g.fillStyle(fx.color, a * 0.9);
    g.fillCircle(
      fx.x + Math.cos(ang) * d,
      fx.y + Math.sin(ang) * d,
      2.2 + (1 - t),
    );
  }
}
