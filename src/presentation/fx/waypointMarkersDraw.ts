/**
 * Ground waypoint markers for move / attack-move — fade after arrival.
 */
import type Phaser from 'phaser';
import type { WaypointMarker } from '../../gameplay/battlefield/battlefieldWaypointMarkers';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

const MOVE = 0xf0c75e;
const ATK = 0xe85a5a;

export function drawWaypointMarkers(
  g: G,
  list: WaypointMarker[],
  timeMs: number,
  view?: ViewBounds | null,
): void {
  for (const m of list) {
    if (view && !inView(view, m.x, m.y)) continue;
    const a = m.fading
      ? Math.max(0.05, m.lifeMs / m.maxLifeMs)
      : 0.85 + 0.15 * Math.sin(timeMs / 200);
    const color = m.kind === 'attackMove' ? ATK : MOVE;
    const pulse = m.fading ? 1 : 1 + 0.06 * Math.sin(timeMs / 160);
    const r = 14 * pulse;

    // Soft ground blot
    g.fillStyle(color, a * 0.2);
    g.fillEllipse(m.x, m.y + 2, r * 1.8, r * 0.7);

    // Outer ring
    g.lineStyle(2.5, color, a);
    g.strokeCircle(m.x, m.y, r);
    g.lineStyle(1.5, 0xffffff, a * 0.55);
    g.strokeCircle(m.x, m.y, r * 0.45);

    // X cross (classic RTS waypoint)
    const arm = r * 0.55;
    g.lineStyle(2.5, color, a * 0.95);
    g.lineBetween(m.x - arm, m.y - arm, m.x + arm, m.y + arm);
    g.lineBetween(m.x + arm, m.y - arm, m.x - arm, m.y + arm);

    if (m.kind === 'attackMove') {
      // Sword tip above — distinguishes A-move from plain move
      g.fillStyle(color, a);
      g.fillTriangle(
        m.x,
        m.y - r - 8,
        m.x + 5,
        m.y - r,
        m.x - 5,
        m.y - r,
      );
    } else {
      // Small flag nub for move
      g.fillStyle(color, a);
      g.fillCircle(m.x, m.y - r - 2, 3);
    }
  }
}
