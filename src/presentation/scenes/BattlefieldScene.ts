/**
 * Milestone 1 — playable battlefield:
 * WASD + edge scroll + zoom camera; placeholder units;
 * left-click select, drag multi-select, right-click move.
 *
 * Phaser 4 input/camera APIs: https://docs.phaser.io/
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import { listSpecies } from '../../data/speciesStub';
import {
  clearSelection,
  createBattlefieldWorld,
  issueMoveSelected,
  selectAt,
  selectInRect,
  selectedCount,
  tickBattlefield,
  type BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import { RtsCamera } from '../camera/rtsCamera';
import { createSkirmishMap } from '../maps/mapManager';

type PointerMode = 'none' | 'select' | 'box' | 'pan';

export class BattlefieldScene extends Phaser.Scene {
  private world!: BattlefieldWorld;
  private cameraCtl!: RtsCamera;
  private boxGfx!: Phaser.GameObjects.Graphics;
  private unitGfx!: Phaser.GameObjects.Graphics;
  private mode: PointerMode = 'none';
  private pointerStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  private cameraStart = { x: 0, y: 0 };
  private hint!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super('Battlefield');
  }

  create(): void {
    // Suppress browser context menu so right-click move works (Phaser pointer.rightButton*).
    this.input.mouse?.disableContextMenu();

    createSkirmishMap(this);
    this.world = createBattlefieldWorld();
    this.cameraCtl = new RtsCamera(this);
    // Frame the placeholder squad
    const first = this.world.units[0];
    if (first) {
      this.cameras.main.centerOn(first.x + 40, first.y);
    }
    this.boxGfx = this.add.graphics().setDepth(50);
    this.unitGfx = this.add.graphics().setDepth(10);

    this.status = this.add
      .text(12, 10, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#f5e6c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.hint = this.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#b8c9d9',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 6 },
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(100);

    const species = listSpecies()
      .map((s) => s.name)
      .join(' · ');
    this.add
      .text(12, 44, `${BRAND.name} · Milestone 1  ·  Species later: ${species}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#7a8fa3',
      })
      .setScrollFactor(0)
      .setDepth(100);

    const menuBtn = this.add
      .text(this.scale.width - 12, 12, 'Menu', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#3a4555',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('Menu'));

    this.scale.on('resize', () => {
      menuBtn.setPosition(this.scale.width - 12, 12);
      this.hint.setPosition(this.scale.width / 2, this.scale.height - 16);
    });
    this.hint.setPosition(this.scale.width / 2, this.scale.height - 16);

    this.bindInput();
    if (flags.adsEnabled) {
      console.warn(`[${BRAND.name}] ads should stay off for this milestone`);
    }
  }

  private bindInput(): void {
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);

    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => clearSelection(this.world));
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    // UI Menu button is interactive — skip map if over top chrome
    if (pointer.y < 40 && pointer.x > this.scale.width - 80) return;

    this.pointerStart = { x: pointer.x, y: pointer.y };
    const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
    this.worldStart = { x: wp.x, y: wp.y };
    this.cameraStart = { ...this.cameraCtl.scroll };

    if (pointer.middleButtonDown()) {
      this.mode = 'pan';
      return;
    }
    if (pointer.rightButtonDown()) {
      // Right-click: move order (classic RTS)
      issueMoveSelected(this.world, wp.x, wp.y);
      this.mode = 'none';
      return;
    }
    // Left: start select / possible box
    this.mode = 'select';
    this.cameraCtl.suppressPan = true;
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (this.mode === 'none') return;
    const dx = pointer.x - this.pointerStart.x;
    const dy = pointer.y - this.pointerStart.y;

    if (this.mode === 'pan') {
      this.cameraCtl.setScroll(
        this.cameraStart.x - dx / this.cameraCtl.zoom,
        this.cameraStart.y - dy / this.cameraCtl.zoom,
      );
      return;
    }

    if (this.mode === 'select' && Math.hypot(dx, dy) > 8) {
      this.mode = 'box';
    }

    if (this.mode === 'box') {
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      this.boxGfx.clear();
      this.boxGfx.lineStyle(2, 0xf0c75e, 0.95);
      this.boxGfx.fillStyle(0xf0c75e, 0.12);
      const x = Math.min(this.worldStart.x, wp.x);
      const y = Math.min(this.worldStart.y, wp.y);
      const w = Math.abs(wp.x - this.worldStart.x);
      const h = Math.abs(wp.y - this.worldStart.y);
      this.boxGfx.strokeRect(x, y, w, h);
      this.boxGfx.fillRect(x, y, w, h);
    }
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    this.cameraCtl.suppressPan = false;
    if (this.mode === 'pan') {
      this.mode = 'none';
      return;
    }
    if (this.mode === 'box') {
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      selectInRect(
        this.world,
        this.worldStart.x,
        this.worldStart.y,
        wp.x,
        wp.y,
      );
      this.boxGfx.clear();
      this.mode = 'none';
      return;
    }
    if (this.mode === 'select' && pointer.leftButtonReleased()) {
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      selectAt(this.world, wp.x, wp.y);
    }
    this.mode = 'none';
  }

  update(_t: number, delta: number): void {
    this.cameraCtl.update(delta);
    tickBattlefield(this.world, delta);
    this.drawUnits();
    const n = selectedCount(this.world);
    this.status.setText(
      n > 0
        ? `${n} selected — right-click to move`
        : 'Left-click select · drag box · right-click move',
    );
    this.hint.setText(
      'WASD / arrows pan · Q/E or wheel zoom · edge scroll · Esc clear · Menu',
    );
  }

  private drawUnits(): void {
    const g = this.unitGfx;
    g.clear();
    for (const u of this.world.units) {
      if (u.selected) {
        g.lineStyle(2, 0xf0c75e, 1);
        g.strokeCircle(u.x, u.y, u.radius + 6);
      }
      g.fillStyle(u.color, 1);
      g.fillCircle(u.x, u.y, u.radius);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(u.x, u.y - 4, 4);
      if (u.moveTarget) {
        g.lineStyle(1, 0xf0c75e, 0.5);
        g.lineBetween(u.x, u.y, u.moveTarget.x, u.moveTarget.y);
        g.fillStyle(0xf0c75e, 0.4);
        g.fillCircle(u.moveTarget.x, u.moveTarget.y, 4);
      }
    }
  }
}
