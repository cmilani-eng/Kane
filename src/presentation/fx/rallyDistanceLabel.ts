/**
 * World-space distance label next to the selected building's rally flag.
 */
import Phaser from 'phaser';
import type { BattlefieldBuilding } from '../../gameplay/battlefield/battlefieldWorld';
import { buildingCanRally } from '../../gameplay/battlefield/battlefieldRally';
import { rallyDistanceTiles } from '../../gameplay/battlefield/rallyDistance';
import { t } from '../../i18n';
import { inView, type ViewBounds } from '../perf/mobileBudget';

export class RallyDistanceLabel {
  private readonly scene: Phaser.Scene;
  private readonly hudCam: Phaser.Cameras.Scene2D.Camera;
  private label: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, hudCam: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene;
    this.hudCam = hudCam;
  }

  sync(
    selected: BattlefieldBuilding | null,
    view?: ViewBounds | null,
  ): void {
    if (
      !selected ||
      selected.team !== 'player' ||
      selected.hp <= 0 ||
      !buildingCanRally(selected)
    ) {
      this.label?.setVisible(false);
      return;
    }
    if (view && !inView(view, selected.rallyX, selected.rallyY)) {
      this.label?.setVisible(false);
      return;
    }

    const n = rallyDistanceTiles(selected);
    const text = t('hud.rallyDist', { n });
    if (!this.label) {
      this.label = this.scene.add
        .text(0, 0, text, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#0a121c',
          backgroundColor: '#f0c75ecc',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5, 0)
        .setDepth(56);
      this.hudCam.ignore(this.label);
    }
    this.label
      .setVisible(true)
      .setText(text)
      .setPosition(selected.rallyX, selected.rallyY + 10);
  }

  destroy(): void {
    this.label?.destroy();
    this.label = null;
  }
}
