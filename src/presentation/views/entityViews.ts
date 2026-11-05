/** Presentation — syncs Phaser sprites from gameplay state (no gameplay writes). */
import Phaser from 'phaser';
import { ANIM } from '../animations/unitAnims';
import { FACTION, UNITS } from '../../config/balance';
import type { World } from '../../gameplay/types';

interface UnitView {
  sprite: Phaser.GameObjects.Sprite;
  ring: Phaser.GameObjects.Image;
  hp: Phaser.GameObjects.Graphics;
}

interface BuildingView {
  sprite: Phaser.GameObjects.Image;
  hp: Phaser.GameObjects.Graphics;
  progress: Phaser.GameObjects.Graphics;
}

export class EntityPresenter {
  private unitViews = new Map<number, UnitView>();
  private buildingViews = new Map<number, BuildingView>();
  private stoneViews = new Map<number, Phaser.GameObjects.Image>();
  private forageViews = new Map<number, Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene) {}

  spawnStatics(world: World): void {
    for (const w of world.wardstones) {
      const img = this.scene.add.image(w.x, w.y, 'wardstone').setDepth(5);
      this.scene.tweens.add({
        targets: img,
        scale: 1.08,
        duration: 1800 + w.id * 90,
        yoyo: true,
        repeat: -1,
      });
      this.stoneViews.set(w.id, img);
    }
    for (const f of world.forageNodes) {
      const img = this.scene.add.image(f.x, f.y, 'forage').setDepth(4);
      this.forageViews.set(f.id, img);
    }
  }

  sync(world: World): void {
    const seenU = new Set<number>();
    for (const u of world.units) {
      seenU.add(u.id);
      let view = this.unitViews.get(u.id);
      const sheet =
        u.team === 'player' ? `sheet-${u.kind}` : `sheet-${u.kind}-enemy`;
      if (!view) {
        const sprite = this.scene.add.sprite(u.x, u.y, sheet, 0).setDepth(10);
        const ring = this.scene.add
          .image(u.x, u.y, 'select-ring')
          .setDepth(9)
          .setVisible(false);
        const hp = this.scene.add.graphics().setDepth(11);
        view = { sprite, ring, hp };
        this.unitViews.set(u.id, view);
      }
      view.sprite.setPosition(u.x, u.y);
      const moving = u.moveTarget != null;
      const animKey =
        u.kind === 'scout'
          ? ANIM.scoutWalk
          : u.kind === 'melee'
            ? ANIM.meleeWalk
            : ANIM.rangedWalk;
      if (moving) {
        if (!view.sprite.anims.isPlaying) view.sprite.play(animKey, true);
      } else {
        view.sprite.anims.stop();
        view.sprite.setFrame(0);
      }
      view.ring.setPosition(u.x, u.y).setVisible(u.selected);
      this.drawHp(view.hp, u.x, u.y - 22, u.hp / u.maxHp, 28);
    }
    for (const [id, view] of this.unitViews) {
      if (!seenU.has(id)) {
        view.sprite.destroy();
        view.ring.destroy();
        view.hp.destroy();
        this.unitViews.delete(id);
      }
    }

    const seenB = new Set<number>();
    for (const b of world.buildings) {
      seenB.add(b.id);
      let view = this.buildingViews.get(b.id);
      if (!view) {
        const key = `${b.kind}-${b.team === 'player' ? 'player' : 'enemy'}`;
        const sprite = this.scene.add.image(b.x, b.y, key).setDepth(8);
        const hp = this.scene.add.graphics().setDepth(11);
        const progress = this.scene.add.graphics().setDepth(11);
        view = { sprite, hp, progress };
        this.buildingViews.set(b.id, view);
      }
      view.sprite.setPosition(b.x, b.y);
      view.sprite.setAlpha(0.45 + 0.55 * b.buildProgress);
      if (b.selected) view.sprite.setTint(0xfff0a8);
      else view.sprite.clearTint();
      this.drawHp(view.hp, b.x, b.y - b.radius - 10, b.hp / b.maxHp, 40);
      view.progress.clear();
      if (b.buildProgress < 1) {
        view.progress.fillStyle(0x222222, 0.7);
        view.progress.fillRect(b.x - 24, b.y + 28, 48, 6);
        view.progress.fillStyle(0xf0c75e, 1);
        view.progress.fillRect(b.x - 24, b.y + 28, 48 * b.buildProgress, 6);
      } else if (b.trainQueue.length > 0) {
        const kind = b.trainQueue[0]!;
        const t = b.trainProgress / UNITS[kind].trainMs;
        view.progress.fillStyle(0x222222, 0.7);
        view.progress.fillRect(b.x - 24, b.y + 28, 48, 6);
        view.progress.fillStyle(0x7ec8ff, 1);
        view.progress.fillRect(b.x - 24, b.y + 28, 48 * t, 6);
      }
    }
    for (const [id, view] of this.buildingViews) {
      if (!seenB.has(id)) {
        view.sprite.destroy();
        view.hp.destroy();
        view.progress.destroy();
        this.buildingViews.delete(id);
      }
    }

    for (const w of world.wardstones) {
      const img = this.stoneViews.get(w.id);
      if (!img) continue;
      if (w.owner === 'player') img.setTint(FACTION.colorAlt);
      else if (w.owner === 'enemy') img.setTint(FACTION.enemyAlt);
      else img.clearTint();
    }
    for (const f of world.forageNodes) {
      const img = this.forageViews.get(f.id);
      if (!img) continue;
      img.setVisible(f.remaining > 0);
      img.setAlpha(0.4 + 0.6 * (f.remaining / 80));
    }
  }

  private drawHp(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    ratio: number,
    width: number,
  ): void {
    g.clear();
    g.fillStyle(0x111111, 0.7);
    g.fillRect(x - width / 2, y, width, 5);
    g.fillStyle(ratio > 0.35 ? 0x6dca6d : 0xd45d5d, 1);
    g.fillRect(x - width / 2, y, width * Math.max(0, ratio), 5);
  }
}
