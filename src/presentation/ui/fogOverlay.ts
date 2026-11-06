/**
 * Fog presentation — coarse cells, redraw when fog.version changes.
 * Only paints cells intersecting the camera view (+ pad) for mobile FPS.
 */
import Phaser from 'phaser';
import {
  FOG_CELL,
  FOG_COLS,
  FOG_ROWS,
  type FogState,
} from '../../gameplay/battlefield/battlefieldFog';
import {
  type ViewBounds,
  viewBoundsFromCamera,
} from '../perf/mobileBudget';

export class FogOverlay {
  readonly gfx: Phaser.GameObjects.Graphics;
  private lastVersion = -1;
  private lastViewKey = '';

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(25);
  }

  refresh(
    fog: FogState,
    cam?: {
      scrollX: number;
      scrollY: number;
      width: number;
      height: number;
      zoom: number;
    },
  ): void {
    const view = cam
      ? viewBoundsFromCamera(
          cam.scrollX,
          cam.scrollY,
          cam.width / cam.zoom,
          cam.height / cam.zoom,
          FOG_CELL * 2,
        )
      : null;
    const viewKey = view
      ? `${(view.left / FOG_CELL) | 0},${(view.top / FOG_CELL) | 0},${(view.right / FOG_CELL) | 0},${(view.bottom / FOG_CELL) | 0}`
      : 'full';
    if (fog.version === this.lastVersion && viewKey === this.lastViewKey) {
      return;
    }
    this.lastVersion = fog.version;
    this.lastViewKey = viewKey;

    const g = this.gfx;
    g.clear();

    let minCx = 0;
    let maxCx = FOG_COLS - 1;
    let minCy = 0;
    let maxCy = FOG_ROWS - 1;
    if (view) {
      minCx = Math.max(0, Math.floor(view.left / FOG_CELL));
      maxCx = Math.min(FOG_COLS - 1, Math.floor(view.right / FOG_CELL));
      minCy = Math.max(0, Math.floor(view.top / FOG_CELL));
      maxCy = Math.min(FOG_ROWS - 1, Math.floor(view.bottom / FOG_CELL));
    }

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const i = cy * FOG_COLS + cx;
        if (fog.visible[i]) continue;
        const x = cx * FOG_CELL;
        const y = cy * FOG_CELL;
        if (!fog.explored[i]) {
          g.fillStyle(0x060a12, 0.92);
          g.fillRect(x, y, FOG_CELL + 1, FOG_CELL + 1);
        } else {
          g.fillStyle(0x0a1220, 0.55);
          g.fillRect(x, y, FOG_CELL + 1, FOG_CELL + 1);
        }
      }
    }
  }
}

export type { ViewBounds };
