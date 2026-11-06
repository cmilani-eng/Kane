/**
 * Attention ping — expanding “look here” ring (distinct from order waypoints).
 */
import type Phaser from 'phaser';
import type { AttentionPing } from '../../gameplay/battlefield/battlefieldAttentionPing';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

/** Soft ice — not gold move / red attack-move. */
const COLOR = 0xb8e8ff;

export function drawAttentionPingList(
  g: G,
  list: AttentionPing[],
  view?: ViewBounds | null,
): void {
  for (const fx of list) {
    if (view && !inView(view, fx.x, fx.y)) continue;
    const t = Math.max(0.05, fx.lifeMs / fx.maxLifeMs);
    const expand = 0.65 + (1 - t) * 1.15;
    const r = 28 * expand;
    const a = t * 0.9;

    g.fillStyle(COLOR, a * 0.1);
    g.fillCircle(fx.x, fx.y, r * 0.55);
    g.lineStyle(2.5, COLOR, a);
    g.strokeCircle(fx.x, fx.y, r);
    g.lineStyle(1.5, 0xfff8e8, a * 0.55);
    g.strokeCircle(fx.x, fx.y, r * 0.45);
    g.fillStyle(0xfff8e8, a * 0.85);
    g.fillCircle(fx.x, fx.y, 3.2);
  }
}
