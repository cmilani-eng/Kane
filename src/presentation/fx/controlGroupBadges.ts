/**
 * Persistent control-group number badges (0–9) above assigned player units.
 * World-space Text; hidden from the HUD camera.
 */
import Phaser from 'phaser';
import type { ControlGroups } from '../../gameplay/battlefield/battlefieldOrders';
import { buildUnitGroupSlotIndex } from '../../gameplay/battlefield/controlGroupLookup';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { inView, type ViewBounds } from '../perf/mobileBudget';

export class ControlGroupBadgeLayer {
  private readonly scene: Phaser.Scene;
  private readonly hudCam: Phaser.Cameras.Scene2D.Camera;
  private readonly texts = new Map<number, Phaser.GameObjects.Text>();

  constructor(scene: Phaser.Scene, hudCam: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene;
    this.hudCam = hudCam;
  }

  sync(
    world: BattlefieldWorld,
    groups: ControlGroups,
    view?: ViewBounds | null,
  ): void {
    const index = buildUnitGroupSlotIndex(groups);
    const alive = new Set<number>();

    for (const u of world.units) {
      if (u.team !== 'player' || u.hp <= 0) continue;
      const slot = index.get(u.id);
      if (slot == null) continue;
      if (view && !inView(view, u.x, u.y)) continue;

      alive.add(u.id);
      let label = this.texts.get(u.id);
      if (!label) {
        label = this.scene.add
          .text(0, 0, String(slot), {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#0a121c',
            backgroundColor: '#f0c75e',
            padding: { x: 4, y: 1 },
          })
          .setOrigin(0.5, 1)
          .setDepth(55);
        this.hudCam.ignore(label);
        this.texts.set(u.id, label);
      }
      label
        .setVisible(true)
        .setText(String(slot))
        .setPosition(u.x + u.radius * 0.55, u.y - u.radius - 14);
    }

    for (const [id, label] of this.texts) {
      if (!alive.has(id)) {
        label.setVisible(false);
      }
    }
  }

  destroy(): void {
    for (const label of this.texts.values()) label.destroy();
    this.texts.clear();
  }
}
