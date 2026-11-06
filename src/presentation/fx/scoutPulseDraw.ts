/**
 * Fog scout reveal pulse — soft ring when new cells are explored.
 */
import type Phaser from 'phaser';
import type { ScoutPulse } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { FOG_CELL } from '../../gameplay/battlefield/battlefieldFog';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

const COLOR = 0x7ec8ff;

export function drawScoutPulseList(
  g: G,
  list: ScoutPulse[],
  view?: ViewBounds | null,
): void {
  for (const fx of list) {
    if (view && !inView(view, fx.x, fx.y)) continue;
    const t = Math.max(0.05, fx.lifeMs / fx.maxLifeMs);
    const expand = 0.55 + (1 - t) * 0.9;
    const r = FOG_CELL * 0.42 * expand;
    const a = t * 0.85;

    g.fillStyle(COLOR, a * 0.12);
    g.fillCircle(fx.x, fx.y, r * 0.7);
    g.lineStyle(2, COLOR, a);
    g.strokeCircle(fx.x, fx.y, r);
    g.lineStyle(1.25, 0xfff8e8, a * 0.45);
    g.strokeCircle(fx.x, fx.y, r * 0.55);
  }
}
