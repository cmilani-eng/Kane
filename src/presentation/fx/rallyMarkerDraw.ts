/**
 * Production rally flag marker — shown for selected player producers.
 */
import type Phaser from 'phaser';
import type { BattlefieldBuilding } from '../../gameplay/battlefield/battlefieldWorld';
import { buildingCanRally } from '../../gameplay/battlefield/battlefieldRally';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

const FLAG = 0xf0c75e;
const POLE = 0xd7e6f2;

export function drawBuildingRallyMarkers(
  g: G,
  buildings: BattlefieldBuilding[],
  selectedBuilding: BattlefieldBuilding | null,
  timeMs: number,
  view?: ViewBounds | null,
): void {
  for (const b of buildings) {
    if (b.team !== 'player' || b.hp <= 0) continue;
    if (!buildingCanRally(b)) continue;
    // Always show for the focused production building; skip others to reduce clutter.
    if (!selectedBuilding || selectedBuilding.id !== b.id) continue;
    if (view && !inView(view, b.rallyX, b.rallyY)) continue;

    const pulse = 1 + 0.05 * Math.sin(timeMs / 180);
    const x = b.rallyX;
    const y = b.rallyY;
    const h = 22 * pulse;

    // Soft ground blot
    g.fillStyle(FLAG, 0.22);
    g.fillEllipse(x, y + 2, 22, 10);

    // Pole
    g.lineStyle(2, POLE, 0.9);
    g.lineBetween(x, y + 4, x, y - h);

    // Flag triangle
    g.fillStyle(FLAG, 0.92);
    g.fillTriangle(x, y - h, x + 14, y - h + 6, x, y - h + 12);

    // Ring
    g.lineStyle(1.5, FLAG, 0.75);
    g.strokeCircle(x, y, 8 * pulse);

    // Line from building to rally (subtle)
    if (!view || inView(view, b.x, b.y)) {
      g.lineStyle(1, FLAG, 0.28);
      g.lineBetween(b.x, b.y, x, y);
    }
  }
}
