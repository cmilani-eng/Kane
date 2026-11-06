/**
 * Stop command visual feedback — brief halt rings on stopped units.
 */
import type Phaser from 'phaser';
import type { StopFx } from '../../gameplay/battlefield/battlefieldStopFx';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

export function drawStopFxList(
  g: G,
  list: StopFx[],
  view?: ViewBounds | null,
): void {
  for (const fx of list) {
    if (view && !inView(view, fx.x, fx.y)) continue;
    const t = Math.max(0.05, fx.lifeMs / fx.maxLifeMs);
    const expand = 0.85 + (1 - t) * 0.7;
    const r = fx.radius * expand;
    const a = t;

    g.fillStyle(fx.color, a * 0.18);
    g.fillCircle(fx.x, fx.y, r * 0.55);
    g.lineStyle(3, fx.color, a);
    g.strokeCircle(fx.x, fx.y, r);
    g.lineStyle(2, 0xffffff, a * 0.7);
    g.strokeCircle(fx.x, fx.y, r * 0.55);

    // Halt bars (||) — reads as "stop"
    const h = r * 0.35;
    const gap = 4;
    g.lineStyle(3.5, 0xffffff, a * 0.95);
    g.lineBetween(fx.x - gap, fx.y - h, fx.x - gap, fx.y + h);
    g.lineBetween(fx.x + gap, fx.y - h, fx.x + gap, fx.y + h);
  }
}
