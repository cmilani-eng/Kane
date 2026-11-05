import Phaser from 'phaser';
import {
  FACTION,
  MAP,
  UNITS,
  WARDSTONE,
  type UnitKind,
} from '../config/balance';
import { flags } from '../config/flags';
import type { World } from '../sim/types';
import {
  clearSelection,
  countOwnedWardstones,
  createWorld,
  enqueueTrain,
  issueMoveOrAttack,
  selectAt,
  selectInRect,
  selectedBuilding,
  selectedUnits,
  tick,
  tickAi,
  tryPlaceBarracks,
} from '../sim/world';
import { hideDomHud, showDomHud } from '../ui/domHud';

type PointerMode = 'none' | 'tap' | 'box' | 'pan' | 'place-barracks';

interface UnitView {
  sprite: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Image;
  hp: Phaser.GameObjects.Graphics;
}

interface BuildingView {
  sprite: Phaser.GameObjects.Image;
  hp: Phaser.GameObjects.Graphics;
  progress: Phaser.GameObjects.Graphics;
}

export class GameScene extends Phaser.Scene {
  private world!: World;
  private aiAcc = { t: 0 };
  private unitViews = new Map<number, UnitView>();
  private buildingViews = new Map<number, BuildingView>();
  private stoneViews = new Map<number, Phaser.GameObjects.Image>();
  private forageViews = new Map<number, Phaser.GameObjects.Image>();
  private boxGfx!: Phaser.GameObjects.Graphics;
  private ghostBarracks: Phaser.GameObjects.Image | null = null;

  private mode: PointerMode = 'none';
  private pointerStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  private cameraStart = { x: 0, y: 0 };
  private pinching = false;
  private pinchStartDist = 0;
  private pinchStartZoom = 1;

  private forageText!: Phaser.GameObjects.Text;
  private auraText!: Phaser.GameObjects.Text;
  private holdText!: Phaser.GameObjects.Text;
  private coachText!: Phaser.GameObjects.Text;
  private cmdHint!: Phaser.GameObjects.Text;
  private topBar!: Phaser.GameObjects.Rectangle;
  private endOverlay: Phaser.GameObjects.Container | null = null;
  private placingBarracks = false;

  constructor() {
    super('Game');
  }

  create(): void {
    this.world = createWorld();
    this.aiAcc = { t: 0 };
    this.unitViews.clear();
    this.buildingViews.clear();
    this.stoneViews.clear();
    this.forageViews.clear();
    this.endOverlay = null;
    this.placingBarracks = false;

    this.cameras.main.setBounds(0, 0, MAP.width, MAP.height);
    this.cameras.main.setZoom(0.85);
    this.cameras.main.centerOn(220, MAP.height - 220);

    this.drawMap();
    this.boxGfx = this.add.graphics().setDepth(50);

    this.spawnStaticViews();
    this.buildHud();
    this.bindInput();

    // Ads must stay unloaded while flag is false (soft-launch posture).
    if (flags.adsEnabled) {
      console.warn('adsEnabled is true — ad SDK not wired in this slice.');
    }

    this.scale.on('resize', this.layoutHud, this);
  }

  private drawMap(): void {
    const g = this.add.graphics();
    for (let y = 0; y < MAP.height; y += 64) {
      for (let x = 0; x < MAP.width; x += 64) {
        const dirt =
          Math.hypot(x - MAP.width / 2, y - MAP.height / 2) < 280 ||
          (x + y) % 192 < 40;
        this.add.image(x + 32, y + 32, dirt ? 'tile-dirt' : 'tile-grass');
      }
    }
    // Soft map edge vignette via rectangles
    g.lineStyle(8, 0x1a2a20, 0.4);
    g.strokeRect(4, 4, MAP.width - 8, MAP.height - 8);
    g.setDepth(1);
  }

  private spawnStaticViews(): void {
    for (const w of this.world.wardstones) {
      const img = this.add.image(w.x, w.y, 'wardstone').setDepth(5);
      this.tweens.add({
        targets: img,
        scale: 1.08,
        duration: 1800 + w.id * 90,
        yoyo: true,
        repeat: -1,
      });
      this.stoneViews.set(w.id, img);
    }
    for (const f of this.world.forageNodes) {
      const img = this.add.image(f.x, f.y, 'forage').setDepth(4);
      this.forageViews.set(f.id, img);
    }
  }

  private buildHud(): void {
    // Resource / coach stay on-canvas; command buttons are DOM for reliable touch.
    this.topBar = this.add
      .rectangle(0, 0, 10, 56, 0x0f1a2e, 0.82)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.forageText = this.add
      .text(12, 10, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#d7f0c8',
      })
      .setScrollFactor(0)
      .setDepth(101);
    this.auraText = this.add
      .text(12, 30, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#c8e0f5',
      })
      .setScrollFactor(0)
      .setDepth(101);
    this.holdText = this.add
      .text(0, 14, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#f0c75e',
      })
      .setScrollFactor(0)
      .setDepth(101);
    this.coachText = this.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#f5e6c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 10, y: 8 },
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(101);
    this.cmdHint = this.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(101);

    showDomHud({
      buildBarracks: () => this.togglePlaceBarracks(),
      trainMelee: () => this.train('melee'),
      trainRanged: () => this.train('ranged'),
      trainScout: () => this.train('scout'),
      menu: () => {
        hideDomHud();
        this.scene.start('Menu');
      },
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => hideDomHud());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => hideDomHud());

    this.layoutHud();
  }

  private layoutHud = (): void => {
    const w = this.scale.width;
    const h = this.scale.height;
    this.topBar.setSize(w, 56);
    // Keep status on the right so it doesn't collide with forage/aura.
    this.holdText.setPosition(w - 12, 14).setOrigin(1, 0);
    this.coachText.setPosition(w / 2, 64);
    this.coachText.setStyle({ wordWrap: { width: Math.min(420, w - 24) } });
    // Leave room above the fixed DOM command bar (~120px).
    this.cmdHint.setPosition(w / 2, h - 128);
  };

  private bindInput(): void {
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.input.on('wheel', (_p: unknown, _g: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.45, 1.6));
    });
  }

  private isHudBlock(pointer: Phaser.Input.Pointer): boolean {
    const y = pointer.y;
    const h = this.scale.height;
    // Two-row command bar (~100px) + top resource bar
    return y < 56 || y > h - 110;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.world.outcome.kind !== 'playing') return;
    if (this.isHudBlock(pointer) && !this.placingBarracks) return;

    const pointers = this.input.manager.pointers.filter((p) => p.active);
    if (pointers.length >= 2) {
      this.pinching = true;
      this.mode = 'pan';
      const [a, b] = pointers;
      this.pinchStartDist = Phaser.Math.Distance.Between(a!.x, a!.y, b!.x, b!.y);
      this.pinchStartZoom = this.cameras.main.zoom;
      this.cameraStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
      return;
    }

    this.pointerStart = { x: pointer.x, y: pointer.y };
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.worldStart = { x: wp.x, y: wp.y };
    this.cameraStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };

    if (this.placingBarracks) {
      this.mode = 'place-barracks';
      return;
    }
    this.mode = 'tap';
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const pointers = this.input.manager.pointers.filter((p) => p.active);
    if (this.pinching && pointers.length >= 2) {
      const [a, b] = pointers;
      const dist = Phaser.Math.Distance.Between(a!.x, a!.y, b!.x, b!.y);
      const zoom = Phaser.Math.Clamp(
        this.pinchStartZoom * (dist / Math.max(1, this.pinchStartDist)),
        0.45,
        1.6,
      );
      this.cameras.main.setZoom(zoom);
      const midX = (a!.x + b!.x) / 2;
      const midY = (a!.y + b!.y) / 2;
      // Light pan with pinch midpoint delta from start — skip for simplicity
      void midX;
      void midY;
      return;
    }

    if (this.mode === 'none') return;

    const dx = pointer.x - this.pointerStart.x;
    const dy = pointer.y - this.pointerStart.y;
    const dist = Math.hypot(dx, dy);

    if (this.mode === 'place-barracks') {
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (!this.ghostBarracks) {
        this.ghostBarracks = this.add
          .image(wp.x, wp.y, 'barracks-player')
          .setAlpha(0.5)
          .setDepth(40);
      } else {
        this.ghostBarracks.setPosition(wp.x, wp.y);
      }
      return;
    }

    if (this.mode === 'tap' && dist > 18) {
      // One-finger drag: box select if mostly stationary camera intent, else pan
      // Prefer pan when drag is significant without shift — mobile RTS: drag empty = pan, drag from unit = box
      const hit = this.hitFriendly(this.worldStart.x, this.worldStart.y);
      if (hit) {
        this.mode = 'box';
      } else {
        this.mode = 'pan';
      }
    }

    if (this.mode === 'pan') {
      const cam = this.cameras.main;
      cam.setScroll(
        this.cameraStart.x - dx / cam.zoom,
        this.cameraStart.y - dy / cam.zoom,
      );
    } else if (this.mode === 'box') {
      this.boxGfx.clear();
      this.boxGfx.lineStyle(2, 0xf0c75e, 0.9);
      this.boxGfx.fillStyle(0xf0c75e, 0.15);
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const x = Math.min(this.worldStart.x, wp.x);
      const y = Math.min(this.worldStart.y, wp.y);
      const w = Math.abs(wp.x - this.worldStart.x);
      const h = Math.abs(wp.y - this.worldStart.y);
      this.boxGfx.strokeRect(x, y, w, h);
      this.boxGfx.fillRect(x, y, w, h);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.pinching) {
      this.pinching = false;
      this.mode = 'none';
      this.boxGfx.clear();
      return;
    }
    if (this.mode === 'none') return;

    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    if (this.mode === 'place-barracks') {
      tryPlaceBarracks(this.world, 'player', wp.x, wp.y);
      this.placingBarracks = false;
      this.ghostBarracks?.destroy();
      this.ghostBarracks = null;
      this.mode = 'none';
      return;
    }

    if (this.mode === 'box') {
      selectInRect(
        this.world,
        'player',
        this.worldStart.x,
        this.worldStart.y,
        wp.x,
        wp.y,
      );
      this.boxGfx.clear();
    } else if (this.mode === 'tap') {
      const selected = selectedUnits(this.world, 'player');
      const building = selectedBuilding(this.world, 'player');
      if (selected.length > 0) {
        issueMoveOrAttack(this.world, 'player', wp.x, wp.y);
      } else if (building) {
        // tap ground sets rally
        building.rally = { x: wp.x, y: wp.y };
        clearSelection(this.world);
        selectAt(this.world, 'player', building.x, building.y);
      } else {
        selectAt(this.world, 'player', wp.x, wp.y);
      }
    }

    this.mode = 'none';
  }

  private hitFriendly(x: number, y: number): boolean {
    for (const u of this.world.units) {
      if (u.team !== 'player') continue;
      if (Math.hypot(u.x - x, u.y - y) <= u.radius + 16) return true;
    }
    return false;
  }

  private togglePlaceBarracks(): void {
    this.placingBarracks = !this.placingBarracks;
    if (!this.placingBarracks) {
      this.ghostBarracks?.destroy();
      this.ghostBarracks = null;
    } else {
      this.world.coach = 'Tap the map to place a Barracks (100 forage).';
    }
  }

  private train(kind: UnitKind): void {
    let barracks = selectedBuilding(this.world, 'player');
    if (!barracks || barracks.kind !== 'barracks' || barracks.buildProgress < 1) {
      barracks =
        this.world.buildings.find(
          (b) =>
            b.team === 'player' && b.kind === 'barracks' && b.buildProgress >= 1,
        ) ?? null;
    }
    if (!barracks) {
      const pending = this.world.buildings.find(
        (b) => b.team === 'player' && b.kind === 'barracks' && b.buildProgress < 1,
      );
      this.world.coach = pending
        ? 'Barracks still building — wait for it to finish.'
        : 'Build a Barracks first, then train units.';
      return;
    }
    if (enqueueTrain(this.world, barracks, kind)) {
      this.world.coach = `Training ${UNITS[kind].name}…`;
    } else {
      this.world.coach = `Need more resources for ${UNITS[kind].name}.`;
    }
  }

  update(_time: number, delta: number): void {
    tick(this.world, delta);
    tickAi(this.world, delta, this.aiAcc);
    this.syncViews();
    this.refreshHud();
    if (this.world.outcome.kind !== 'playing' && !this.endOverlay) {
      this.showEnd();
    }
  }

  private syncViews(): void {
    const seenU = new Set<number>();
    for (const u of this.world.units) {
      seenU.add(u.id);
      let view = this.unitViews.get(u.id);
      if (!view) {
        const key = `unit-${u.kind}-${u.team === 'player' ? 'player' : 'enemy'}`;
        const sprite = this.add.image(u.x, u.y, key).setDepth(10);
        const ring = this.add.image(u.x, u.y, 'select-ring').setDepth(9).setVisible(false);
        const hp = this.add.graphics().setDepth(11);
        view = { sprite, ring, hp };
        this.unitViews.set(u.id, view);
      }
      view.sprite.setPosition(u.x, u.y);
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
    for (const b of this.world.buildings) {
      seenB.add(b.id);
      let view = this.buildingViews.get(b.id);
      if (!view) {
        const key = `${b.kind}-${b.team === 'player' ? 'player' : 'enemy'}`;
        const sprite = this.add.image(b.x, b.y, key).setDepth(8);
        const hp = this.add.graphics().setDepth(11);
        const progress = this.add.graphics().setDepth(11);
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

    for (const w of this.world.wardstones) {
      const img = this.stoneViews.get(w.id);
      if (!img) continue;
      if (w.owner === 'player') img.setTint(FACTION.colorAlt);
      else if (w.owner === 'enemy') img.setTint(FACTION.enemyAlt);
      else img.clearTint();
    }
    for (const f of this.world.forageNodes) {
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

  private refreshHud(): void {
    const p = this.world.player;
    this.forageText.setText(`Forage (food): ${Math.floor(p.forage)}`);
    this.auraText.setText(`Aura (magic): ${p.aura.toFixed(1)}`);
    const owned = countOwnedWardstones(this.world, 'player');
    const need = WARDSTONE.holdNeeded;
    const holdSec = Math.floor(p.holdTimerMs / 1000);
    const winSec = Math.floor(WARDSTONE.holdWinMs / 1000);
    this.holdText.setText(
      owned >= need
        ? `Holding ${owned}/${need} Wardstones · ${holdSec}/${winSec}s`
        : `Wardstones ${owned}/${need} · Keep HP ${Math.max(0, Math.floor(this.keepHp('player')))}`,
    );
    this.coachText.setText(this.world.coach);
    const sel = selectedUnits(this.world, 'player');
    const b = selectedBuilding(this.world, 'player');
    if (this.placingBarracks) {
      this.cmdHint.setText('Place mode — tap map · Barracks cost 100 forage');
    } else if (sel.length) {
      this.cmdHint.setText(
        `${sel.length} selected — tap ground / berries / Wardstone / enemy`,
      );
    } else if (b) {
      this.cmdHint.setText(
        `${b.kind === 'keep' ? 'Keep' : 'Barracks'} selected — tap Train · tap map for rally`,
      );
    } else {
      this.cmdHint.setText('Tap units to select · drag from a unit for box select · drag empty to pan');
    }
  }

  private keepHp(team: 'player' | 'enemy'): number {
    const k = this.world.buildings.find((b) => b.team === team && b.kind === 'keep');
    return k?.hp ?? 0;
  }

  private showEnd(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const outcome = this.world.outcome;
    const win = outcome.kind === 'win';
    const title = win ? 'Victory' : 'Defeat';
    const reason =
      outcome.kind === 'playing'
        ? ''
        : outcome.reason === 'keep'
          ? win
            ? 'Enemy Keep destroyed'
            : 'Your Keep fell'
          : win
            ? 'Wardstones held'
            : 'Rival held the Wardstones';

    const panel = this.add.rectangle(0, 0, Math.min(360, w - 24), 220, 0x0f1a2e, 0.92)
      .setStrokeStyle(3, win ? 0xf0c75e : 0x8a6a9a);
    const t = this.add
      .text(0, -60, title, {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: win ? '#f0c75e' : '#e0c8f0',
      })
      .setOrigin(0.5);
    const r = this.add
      .text(0, -18, reason, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#d7e6f2',
      })
      .setOrigin(0.5);
    const againBg = this.add
      .rectangle(0, 50, 180, 48, 0x3d7ea6)
      .setStrokeStyle(2, 0xf0c75e)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.scene.restart();
      });
    const again = this.add
      .text(0, 50, 'Rematch', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);

    this.endOverlay = this.add
      .container(w / 2, h / 2, [panel, t, r, againBg, again])
      .setScrollFactor(0)
      .setDepth(200);
    this.endOverlay.setAlpha(0);
    this.tweens.add({ targets: this.endOverlay, alpha: 1, duration: 400 });
  }
}
