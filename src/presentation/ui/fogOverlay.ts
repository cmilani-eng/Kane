/**
 * Fog presentation — coarse cells, redraw when fog.version changes.
 */
import Phaser from 'phaser';
import {
  FOG_CELL,
  FOG_COLS,
  FOG_ROWS,
  type FogState,
} from '../../gameplay/battlefield/battlefieldFog';

export class FogOverlay {
  readonly gfx: Phaser.GameObjects.Graphics;
  private lastVersion = -1;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(25);
  }

  refresh(fog: FogState): void {
    if (fog.version === this.lastVersion) return;
    this.lastVersion = fog.version;
    const g = this.gfx;
    g.clear();

    // Batch: unexplored black, explored-but-hidden soft veil
    for (let cy = 0; cy < FOG_ROWS; cy++) {
      for (let cx = 0; cx < FOG_COLS; cx++) {
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
