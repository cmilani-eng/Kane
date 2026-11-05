import Phaser from 'phaser';
import { UNITS, WARDSTONE, type UnitKind } from '../config/balance';
import { flags } from '../config/flags';
import { BRAND } from '../config/brand';
import { RtsCamera } from '../camera/rtsCamera';
import { createSkirmishMap } from '../map/mapManager';
import { EntityPresenter } from '../presentation/entityViews';
import { playSfx } from '../audio/audioAnims';
import { createLocalSession } from '../networking/multiplayerStub';
import type { World } from '../sim/types';
import {
  clearSelection,
  countOwnedWardstones,
  createWorld,
  enqueueTrain,
  issueMoveOrAttack,
  selectAllOfKind,
  selectAt,
  selectInRect,
  selectedBuilding,
  selectedUnits,
  tick,
  tickAi,
  tryPlaceBarracks,
} from '../sim/world';
import { hideDomHud, showDomHud } from '../ui/domHud';
import { dist } from '../sim/math';

type PointerMode = 'none' | 'tap' | 'box' | 'pan' | 'place-barracks';

export class GameScene extends Phaser.Scene {
  private world!: World;
  private aiAcc = { t: 0 };
  private cameraCtl!: RtsCamera;
  private presenter!: EntityPresenter;
  private boxGfx!: Phaser.GameObjects.Graphics;
  private ghostBarracks: Phaser.GameObjects.Image | null = null;

  private mode: PointerMode = 'none';
  private pointerStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  private cameraStart = { x: 0, y: 0 };
  private pinching = false;
  private pinchStartDist = 0;
  private pinchStartZoom = 1;
  private shiftBox = false;

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
    void createLocalSession(); // multiplayer stub — local AI only
    this.world = createWorld();
    this.aiAcc = { t: 0 };
    this.endOverlay = null;
    this.placingBarracks = false;
    this.ghostBarracks = null;

    createSkirmishMap(this);
    this.cameraCtl = new RtsCamera(this);
    this.presenter = new EntityPresenter(this);
    this.presenter.spawnStatics(this.world);
    this.boxGfx = this.add.graphics().setDepth(50);

    this.buildHud();
    this.bindInput();
    this.bindKeyboard();

    if (flags.adsEnabled) {
      console.warn(`[${BRAND.name}] adsEnabled is true — ad SDK not wired.`);
    }
    this.scale.on('resize', this.layoutHud, this);
  }

  private buildHud(): void {
    this.topBar = this.add
      .rectangle(0, 0, 10, 56, 0x0f1a2e, 0.82)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);
    this.forageText = this.add
      .text(12, 10, '', { fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#d7f0c8' })
      .setScrollFactor(0)
      .setDepth(101);
    this.auraText = this.add
      .text(12, 30, '', { fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#c8e0f5' })
      .setScrollFactor(0)
      .setDepth(101);
    this.holdText = this.add
      .text(0, 14, '', { fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#f0c75e' })
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
      .text(0, 0, '', { fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#b8c9d9' })
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
    this.holdText.setPosition(w - 12, 14).setOrigin(1, 0);
    this.coachText.setPosition(w / 2, 64);
    this.coachText.setStyle({ wordWrap: { width: Math.min(420, w - 24) } });
    this.cmdHint.setPosition(w / 2, h - 128);
  };

  private bindKeyboard(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.on('keydown-SHIFT', () => {
      this.shiftBox = true;
    });
    kb.on('keyup-SHIFT', () => {
      this.shiftBox = false;
    });
    kb.on('keydown-ONE', () => selectAllOfKind(this.world, 'player', 'scout'));
    kb.on('keydown-TWO', () => selectAllOfKind(this.world, 'player', 'melee'));
    kb.on('keydown-THREE', () => selectAllOfKind(this.world, 'player', 'ranged'));
    kb.on('keydown-ESC', () => {
      clearSelection(this.world);
      if (this.placingBarracks) this.togglePlaceBarracks();
    });
    kb.on('keydown-B', () => this.togglePlaceBarracks());
  }

  private bindInput(): void {
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  private isHudBlock(pointer: Phaser.Input.Pointer): boolean {
    const y = pointer.y;
    const h = this.scale.height;
    return y < 56 || y > h - 110;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.world.outcome.kind !== 'playing') return;
    if (this.isHudBlock(pointer) && !this.placingBarracks) return;

    // Middle mouse = pan
    if (pointer.middleButtonDown()) {
      this.mode = 'pan';
      this.pointerStart = { x: pointer.x, y: pointer.y };
      this.cameraStart = { x: this.cameraCtl.scroll.x, y: this.cameraCtl.scroll.y };
      return;
    }

    const pointers = this.input.manager.pointers.filter((p) => p.active);
    if (pointers.length >= 2) {
      this.pinching = true;
      this.mode = 'pan';
      const [a, b] = pointers;
      this.pinchStartDist = Phaser.Math.Distance.Between(a!.x, a!.y, b!.x, b!.y);
      this.pinchStartZoom = this.cameraCtl.zoom;
      this.cameraStart = { x: this.cameraCtl.scroll.x, y: this.cameraCtl.scroll.y };
      return;
    }

    this.pointerStart = { x: pointer.x, y: pointer.y };
    const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
    this.worldStart = { x: wp.x, y: wp.y };
    this.cameraStart = { x: this.cameraCtl.scroll.x, y: this.cameraCtl.scroll.y };

    if (this.placingBarracks) {
      this.mode = 'place-barracks';
      return;
    }
    if (this.shiftBox || pointer.rightButtonDown()) {
      this.mode = 'box';
      return;
    }
    this.mode = 'tap';
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const pointers = this.input.manager.pointers.filter((p) => p.active);
    if (this.pinching && pointers.length >= 2) {
      const [a, b] = pointers;
      const d = Phaser.Math.Distance.Between(a!.x, a!.y, b!.x, b!.y);
      this.cameraCtl.setZoom(
        this.pinchStartZoom * (d / Math.max(1, this.pinchStartDist)),
      );
      return;
    }
    if (this.mode === 'none') return;

    const dx = pointer.x - this.pointerStart.x;
    const dy = pointer.y - this.pointerStart.y;
    const distScreen = Math.hypot(dx, dy);

    if (this.mode === 'place-barracks') {
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      if (!this.ghostBarracks) {
        this.ghostBarracks = this.add
          .image(wp.x, wp.y, 'barracks-player')
          .setAlpha(0.5)
          .setDepth(40);
      } else this.ghostBarracks.setPosition(wp.x, wp.y);
      return;
    }

    if (this.mode === 'tap' && distScreen > 18) {
      const hit = this.hitFriendly(this.worldStart.x, this.worldStart.y);
      this.mode = hit || this.shiftBox ? 'box' : 'pan';
    }

    if (this.mode === 'pan') {
      this.cameraCtl.setScroll(
        this.cameraStart.x - dx / this.cameraCtl.zoom,
        this.cameraStart.y - dy / this.cameraCtl.zoom,
      );
    } else if (this.mode === 'box') {
      this.boxGfx.clear();
      this.boxGfx.lineStyle(2, 0xf0c75e, 0.9);
      this.boxGfx.fillStyle(0xf0c75e, 0.15);
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      const x = Math.min(this.worldStart.x, wp.x);
      const y = Math.min(this.worldStart.y, wp.y);
      this.boxGfx.strokeRect(x, y, Math.abs(wp.x - this.worldStart.x), Math.abs(wp.y - this.worldStart.y));
      this.boxGfx.fillRect(x, y, Math.abs(wp.x - this.worldStart.x), Math.abs(wp.y - this.worldStart.y));
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
    const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);

    if (this.mode === 'place-barracks') {
      if (tryPlaceBarracks(this.world, 'player', wp.x, wp.y)) playSfx('build');
      this.placingBarracks = false;
      this.ghostBarracks?.destroy();
      this.ghostBarracks = null;
      this.mode = 'none';
      return;
    }

    if (this.mode === 'box') {
      selectInRect(this.world, 'player', this.worldStart.x, this.worldStart.y, wp.x, wp.y);
      playSfx('select');
      this.boxGfx.clear();
    } else if (this.mode === 'tap') {
      const selected = selectedUnits(this.world, 'player');
      const building = selectedBuilding(this.world, 'player');
      if (selected.length > 0) {
        issueMoveOrAttack(this.world, 'player', wp.x, wp.y);
      } else if (building) {
        building.rally = { x: wp.x, y: wp.y };
        clearSelection(this.world);
        selectAt(this.world, 'player', building.x, building.y);
      } else {
        selectAt(this.world, 'player', wp.x, wp.y);
        playSfx('select');
      }
    }
    this.mode = 'none';
  }

  private hitFriendly(x: number, y: number): boolean {
    for (const u of this.world.units) {
      if (u.team !== 'player') continue;
      if (dist(u.x, u.y, x, y) <= u.radius + 16) return true;
    }
    return false;
  }

  private togglePlaceBarracks(): void {
    this.placingBarracks = !this.placingBarracks;
    if (!this.placingBarracks) {
      this.ghostBarracks?.destroy();
      this.ghostBarracks = null;
      this.world.coach = 'Placement cancelled.';
    } else {
      this.world.coach = 'Tap or click the map to place a Barracks (100 forage).';
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
    this.cameraCtl.update(delta);
    tick(this.world, delta);
    tickAi(this.world, delta, this.aiAcc);
    this.presenter.sync(this.world);
    this.refreshHud();
    if (this.world.outcome.kind !== 'playing' && !this.endOverlay) {
      this.showEnd();
    }
  }

  private refreshHud(): void {
    const p = this.world.player;
    this.forageText.setText(`Forage (food): ${Math.floor(p.forage)}`);
    this.auraText.setText(`Aura (magic): ${p.aura.toFixed(1)}`);
    const owned = countOwnedWardstones(this.world, 'player');
    const holdSec = Math.floor(p.holdTimerMs / 1000);
    const winSec = Math.floor(WARDSTONE.holdWinMs / 1000);
    const keep = this.world.buildings.find((b) => b.team === 'player' && b.kind === 'keep');
    this.holdText.setText(
      owned >= WARDSTONE.holdNeeded
        ? `Holding ${owned}/${WARDSTONE.holdNeeded} · ${holdSec}/${winSec}s`
        : `Wardstones ${owned}/${WARDSTONE.holdNeeded} · Keep HP ${Math.max(0, Math.floor(keep?.hp ?? 0))}`,
    );
    this.coachText.setText(this.world.coach);
    const sel = selectedUnits(this.world, 'player');
    const b = selectedBuilding(this.world, 'player');
    if (this.placingBarracks) {
      this.cmdHint.setText('Place mode — click/tap map · Barracks cost 100 forage');
    } else if (sel.length) {
      this.cmdHint.setText(`${sel.length} selected — click ground / berries / Wardstone / enemy`);
    } else if (b) {
      this.cmdHint.setText(
        `${b.kind === 'keep' ? 'Keep' : 'Barracks'} selected — Train · click map for rally`,
      );
    } else {
      this.cmdHint.setText(
        'Select units · Shift/drag box · WASD pan · Q/E zoom · B build',
      );
    }
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

    const panel = this.add
      .rectangle(0, 0, Math.min(360, w - 24), 240, 0x0f1a2e, 0.92)
      .setStrokeStyle(3, win ? 0xf0c75e : 0x8a6a9a);
    const brand = this.add
      .text(0, -88, BRAND.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#f0c75e',
      })
      .setOrigin(0.5);
    const t = this.add
      .text(0, -52, title, {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: win ? '#f0c75e' : '#e0c8f0',
      })
      .setOrigin(0.5);
    const r = this.add
      .text(0, -10, reason, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#d7e6f2',
      })
      .setOrigin(0.5);
    const tag = this.add
      .text(0, 22, BRAND.tagline, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#9ab0c4',
      })
      .setOrigin(0.5);
    const againBg = this.add
      .rectangle(0, 70, 180, 48, 0x3d7ea6)
      .setStrokeStyle(2, 0xf0c75e)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.restart());
    const again = this.add
      .text(0, 70, 'Rematch', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);

    this.endOverlay = this.add
      .container(w / 2, h / 2, [panel, brand, t, r, tag, againBg, again])
      .setScrollFactor(0)
      .setDepth(200);
    this.endOverlay.setAlpha(0);
    this.tweens.add({ targets: this.endOverlay, alpha: 1, duration: 400 });
  }
}
