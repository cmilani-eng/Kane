/**
 * Fog scout reveal pulse — soft ring when new cells are explored.
 * Honors reduce-motion with a quieter, less expanding ring.
 */
import type Phaser from 'phaser';
import { isReduceMotion } from '../../database/motionPrefs';
import type { ScoutPulse } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { FOG_CELL } from '../../gameplay/battlefield/battlefieldFog';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

const COLOR = 0x7ec8ff;

/** Stroke alpha scale from remaining life (1 at spawn). */
export function scoutPulseAlpha(lifeRatio: number, quiet: boolean): number {
  const t = Math.max(0, Math.min(1, lifeRatio));
  return quiet ? t * 0.28 : t * 0.85;
}

/** Ring expand factor from remaining life. */
export function scoutPulseExpand(lifeRatio: number, quiet: boolean): number {
  const t = Math.max(0, Math.min(1, lifeRatio));
  return quiet ? 0.72 : 0.55 + (1 - t) * 0.9;
}

export function drawScoutPulseList(
  g: G,
  list: ScoutPulse[],
  view?: ViewBounds | null,
): void {
  const quiet = isReduceMotion();
  for (const fx of list) {
    if (view && !inView(view, fx.x, fx.y)) continue;
    const life = Math.max(0.05, fx.lifeMs / fx.maxLifeMs);
    const expand = scoutPulseExpand(life, quiet);
    const r = FOG_CELL * 0.42 * expand;
    const a = scoutPulseAlpha(life, quiet);

    if (!quiet) {
      g.fillStyle(COLOR, a * 0.12);
      g.fillCircle(fx.x, fx.y, r * 0.7);
    }
    g.lineStyle(quiet ? 1.25 : 2, COLOR, a);
    g.strokeCircle(fx.x, fx.y, r);
    if (!quiet) {
      g.lineStyle(1.25, 0xfff8e8, a * 0.45);
      g.strokeCircle(fx.x, fx.y, r * 0.55);
    }
  }
}
