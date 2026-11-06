/**
 * Battlefield minimap — unit/building dots + click-to-pan.
 * Drawn with scrollFactor 0 for the HUD camera.
 */
import Phaser from 'phaser';
import { MAP } from '../../config/balance';
import {
  enemyRevealed,
  isExplored,
} from '../../gameplay/battlefield/battlefieldFog';
import { isIdleWorker } from '../../gameplay/battlefield/idleWorkers';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import type { RtsCamera } from '../camera/rtsCamera';
import { playSfx } from '../audio/sfx';
import { MOBILE_PERF } from '../perf/mobileBudget';

export class Minimap {
  private readonly scene: Phaser.Scene;
  private readonly world: BattlefieldWorld;
  private readonly cameraCtl: RtsCamera;
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly hit: Phaser.GameObjects.Rectangle;
  private readonly frame: Phaser.GameObjects.Rectangle;

  private mapX = 0;
  private mapY = 0;
  private mapW = 180;
  private mapH = 120;
  private dragging = false;
  private pulseMs = 0;
  /** Extra lift when DOM selection panel is open. */
  private bottomInset = 0;

  constructor(
    scene: Phaser.Scene,
    world: BattlefieldWorld,
    cameraCtl: RtsCamera,
  ) {
    this.scene = scene;
    this.world = world;
    this.cameraCtl = cameraCtl;

    this.frame = scene.add
      .rectangle(0, 0, this.mapW + 8, this.mapH + 8, 0x0f1a2e, 0.88)
      .setStrokeStyle(2, 0xf0c75e, 0.85)
      .setScrollFactor(0)
      .setDepth(110)
      .setOrigin(0, 0);

    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(111);

    this.hit = scene.add
      .rectangle(0, 0, this.mapW, this.mapH, 0x000000, 0.001)
      .setScrollFactor(0)
      .setDepth(112)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });

    this.hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.panToPointer(p);
      playSfx('ui');
    });
    this.hit.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragging && p.isDown) this.panToPointer(p);
    });
    this.hit.on('pointerup', () => {
      this.dragging = false;
    });
    this.hit.on('pointerout', () => {
      this.dragging = false;
    });

    this.layout();
    scene.scale.on('resize', () => this.layout());
  }

  objects(): Phaser.GameObjects.GameObject[] {
    return [this.frame, this.gfx, this.hit];
  }

  setBottomInset(px: number): void {
    const next = Math.max(0, Math.floor(px));
    if (next === this.bottomInset) return;
    this.bottomInset = next;
    this.layout();
  }

  layout(): void {
    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;
    const narrow = sw < 720;
    this.mapW = narrow ? Math.min(140, sw * 0.36) : 180;
    this.mapH = (this.mapW * MAP.height) / MAP.width;
    const pad = narrow ? 8 : 12;
    this.mapX = sw - pad - this.mapW;
    this.mapY =
      sh - pad - this.mapH - (narrow ? 70 : 78) - this.bottomInset;

    this.frame
      .setSize(this.mapW + 8, this.mapH + 8)
      .setPosition(this.mapX - 4, this.mapY - 4);
    this.hit.setSize(this.mapW, this.mapH).setPosition(this.mapX, this.mapY);
  }

  private panToPointer(p: Phaser.Input.Pointer): void {
    const lx = Phaser.Math.Clamp(p.x - this.mapX, 0, this.mapW);
    const ly = Phaser.Math.Clamp(p.y - this.mapY, 0, this.mapH);
    const wx = (lx / this.mapW) * MAP.width;
    const wy = (ly / this.mapH) * MAP.height;
    this.cameraCtl.centerOn(wx, wy);
  }

  private refreshAcc = 999;

  /** Throttled redraw — call every frame; paints on cadence. */
  refresh(dtMs = 16): void {
    this.pulseMs += dtMs;
    this.refreshAcc += dtMs;
    if (this.refreshAcc < MOBILE_PERF.minimapMs) return;
    this.refreshAcc = 0;
    this.redraw();
  }

  private redraw(): void {
    const g = this.gfx;
    g.clear();

    // Terrain fill (explored tint)
    g.fillStyle(0x0a1018, 1);
    g.fillRect(this.mapX, this.mapY, this.mapW, this.mapH);

    const sx = this.mapW / MAP.width;
    const sy = this.mapH / MAP.height;
    const fog = this.world.fog;

    // Explored / visible terrain samples (coarse — cheap)
    const step = 80;
    for (let wy = step / 2; wy < MAP.height; wy += step) {
      for (let wx = step / 2; wx < MAP.width; wx += step) {
        if (!isExplored(fog, wx, wy)) continue;
        const x = this.mapX + wx * sx;
        const y = this.mapY + wy * sy;
        const vis = enemyRevealed(fog, wx, wy);
        g.fillStyle(vis ? 0x1a2a28 : 0x121a22, 1);
        g.fillRect(x - step * sx * 0.5, y - step * sy * 0.5, step * sx + 1, step * sy + 1);
      }
    }

    // Resource nodes (tiny) — explored only
    for (const n of this.world.nodes) {
      if (n.remaining <= 0) continue;
      if (!isExplored(fog, n.x, n.y)) continue;
      const x = this.mapX + n.x * sx;
      const y = this.mapY + n.y * sy;
      if (n.resourceId === 'magic_crystals') {
        g.fillStyle(0x7ec8ff, 0.95);
        g.fillTriangle(x, y - 3.2, x + 2.4, y + 2.2, x - 2.4, y + 2.2);
      } else {
        g.fillStyle(0xf0c75e, 0.95);
        g.fillCircle(x - 1.2, y + 0.4, 1.8);
        g.fillCircle(x + 1.4, y, 1.5);
      }
    }

    // CORE fragments
    for (const f of this.world.coreFragments ?? []) {
      if (!isExplored(fog, f.x, f.y)) continue;
      const x = this.mapX + f.x * sx;
      const y = this.mapY + f.y * sy;
      const col =
        f.owner === 'player'
          ? 0x7ec8ff
          : f.owner === 'enemy'
            ? 0xe87aa8
            : 0xb8c9d9;
      g.fillStyle(col, 1);
      g.fillCircle(x, y, 3);
    }

    // Buildings
    for (const b of this.world.buildings) {
      if (b.hp <= 0) continue;
      if (b.team === 'enemy' && !enemyRevealed(fog, b.x, b.y)) continue;
      const x = this.mapX + b.x * sx;
      const y = this.mapY + b.y * sy;
      const player = b.team === 'player';
      g.fillStyle(player ? 0xf0c75e : 0xe87aa8, 1);
      g.fillRect(x - 3, y - 3, 6, 6);
    }

    // Units
    const idlePulse = 0.35 + 0.25 * Math.sin(this.pulseMs / 850);
    for (const u of this.world.units) {
      if (u.hp <= 0) continue;
      if (u.team === 'enemy' && !enemyRevealed(fog, u.x, u.y)) continue;
      const x = this.mapX + u.x * sx;
      const y = this.mapY + u.y * sy;
      const player = u.team === 'player';
      if (isIdleWorker(u)) {
        // Soft attention ring — yellow, slow pulse (not spammy)
        g.lineStyle(1.5, u.carrying > 0 ? 0xffc857 : 0xf0c75e, idlePulse);
        g.strokeCircle(x, y, 5.5);
      }
      g.fillStyle(player ? 0x5dce6a : 0xe85a5a, 1);
      g.fillCircle(x, y, u.selected ? 3.2 : 2.2);
    }

    // Camera viewport
    const cam = this.scene.cameras.main;
    const vw = cam.width / cam.zoom;
    const vh = cam.height / cam.zoom;
    const vx = this.mapX + cam.scrollX * sx;
    const vy = this.mapY + cam.scrollY * sy;
    const vwM = vw * sx;
    const vhM = vh * sy;
    g.lineStyle(1, 0xffffff, 0.9);
    g.strokeRect(vx, vy, vwM, vhM);
  }
}
