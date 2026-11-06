/**
 * World-space last-seen age labels on enemy leave-vision building ghosts.
 */
import Phaser from 'phaser';
import { enemyRevealed } from '../../gameplay/battlefield/battlefieldFog';
import type {
  BattlefieldBuilding,
  BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';
import { inView, type ViewBounds } from '../perf/mobileBudget';
import { enemyBuildingGhostAgeSec } from './buildingLastSeenGhost';

export class BuildingGhostAgeLabels {
  private readonly scene: Phaser.Scene;
  private readonly hudCam: Phaser.Cameras.Scene2D.Camera;
  private readonly labels = new Map<number, Phaser.GameObjects.Text>();

  constructor(scene: Phaser.Scene, hudCam: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene;
    this.hudCam = hudCam;
  }

  sync(
    world: BattlefieldWorld,
    lastSeen: Map<number, number>,
    nowMs: number,
    view?: ViewBounds | null,
  ): void {
    const keep = new Set<number>();
    for (const b of world.buildings) {
      if (b.team !== 'enemy' || b.hp <= 0) continue;
      if (enemyRevealed(world.fog, b.x, b.y)) continue;
      if (view && !inView(view, b.x, b.y)) continue;
      const ageSec = enemyBuildingGhostAgeSec(lastSeen, b.id, nowMs);
      if (ageSec == null) continue;
      keep.add(b.id);
      this.place(b, ageSec);
    }
    for (const [id, label] of this.labels) {
      if (!keep.has(id)) {
        label.destroy();
        this.labels.delete(id);
      }
    }
  }

  private place(b: BattlefieldBuilding, ageSec: number): void {
    const text = t('hud.ghostAge', { sec: ageSec });
    let label = this.labels.get(b.id);
    if (!label) {
      label = this.scene.add
        .text(0, 0, text, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#e8f0ff',
          backgroundColor: '#1a2030aa',
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5, 0)
        .setDepth(55);
      this.hudCam.ignore(label);
      this.labels.set(b.id, label);
    }
    label
      .setVisible(true)
      .setText(text)
      .setPosition(b.x, b.y + b.radius + 2)
      .setAlpha(0.55 + 0.35 * Math.max(0, 1 - ageSec / 3));
  }

  destroy(): void {
    for (const label of this.labels.values()) label.destroy();
    this.labels.clear();
  }
}
