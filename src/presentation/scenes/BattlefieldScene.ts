/**
 * Battlefield — select/move + combat (health, attack ranges, RMB attack).
 * Phaser 4 APIs: https://docs.phaser.io/
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import { SPECIES } from '../../data/speciesStub';
import {
  findEnemyAt,
  issueAttackSelected,
  livingByTeam,
  tickBattlefieldCombat,
} from '../../gameplay/battlefield/battlefieldCombat';
import {
  clearSelection,
  createBattlefieldWorld,
  issueMoveSelected,
  selectAt,
  selectInRect,
  selectedCount,
  selectedUnits,
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
  private shiftKey: Phaser.Input.Keyboard.Key | null = null;

  constructor() {
    super('Battlefield');
  }

  create(): void {
    this.input.mouse?.disableContextMenu();

    createSkirmishMap(this);
    this.world = createBattlefieldWorld();
    this.cameraCtl = new RtsCamera(this);
    const first = this.world.units.find((u) => u.team === 'player');
    if (first) this.cameras.main.centerOn(first.x + 80, first.y - 40);

    this.boxGfx = this.add.graphics().setDepth(50);
    this.unitGfx = this.add.graphics().setDepth(10);

    this.add
      .text(12, 8, `${BRAND.name}  ·  Combat skirmish`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '18px',
        color: '#f5e6c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    const species = SPECIES[this.world.speciesId];
    this.add
      .text(
        12,
        42,
        `Species: ${species.name}  ·  Enemy: placeholders  ·  ${species.uniqueMechanic} later`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#9eb4c8',
          backgroundColor: '#0f1a2ecc',
          padding: { x: 8, y: 4 },
        },
      )
      .setScrollFactor(0)
      .setDepth(100);

    this.status = this.add
      .text(12, 68, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#f5e6c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.hint = this.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#b8c9d9',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 6 },
      })
      .setOrigin(0.5, 1)
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

    this.shiftKey =
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT) ?? null;

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
    this.input.keyboard?.on('keydown-ESC', () => clearSelection(this.world));
  }

  private shiftHeld(): boolean {
    return !!this.shiftKey?.isDown;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
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
      const enemy = findEnemyAt(this.world, wp.x, wp.y, 'player');
      if (enemy) issueAttackSelected(this.world, enemy);
      else issueMoveSelected(this.world, wp.x, wp.y);
      this.mode = 'none';
      return;
    }
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
    const additive = this.shiftHeld();
    if (this.mode === 'box') {
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      selectInRect(
        this.world,
        this.worldStart.x,
        this.worldStart.y,
        wp.x,
        wp.y,
        additive,
      );
      this.boxGfx.clear();
      this.mode = 'none';
      return;
    }
    if (this.mode === 'select' && pointer.leftButtonReleased()) {
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      selectAt(this.world, wp.x, wp.y, additive);
    }
    this.mode = 'none';
  }

  update(_t: number, delta: number): void {
    this.cameraCtl.update(delta);
    tickBattlefield(this.world, delta);
    tickBattlefieldCombat(this.world, delta);
    this.drawUnits();
    this.refreshHud();
  }

  private refreshHud(): void {
    const n = selectedCount(this.world);
    const sel = selectedUnits(this.world);
    const friends = livingByTeam(this.world, 'player');
    const foes = livingByTeam(this.world, 'enemy');
    if (n === 0) {
      this.status.setText(
        `Alive ${friends} vs ${foes}  ·  Select Brutes · RMB enemy to attack · RMB ground to move`,
      );
    } else if (n === 1) {
      const u = sel[0]!;
      this.status.setText(
        `1 selected — ${u.name}  HP ${Math.ceil(u.hp)}/${u.maxHp}  dmg ${u.dmg}  range ${u.range}  ·  team player`,
      );
    } else {
      const hp = sel.reduce((s, u) => s + u.hp, 0);
      const max = sel.reduce((s, u) => s + u.maxHp, 0);
      this.status.setText(
        `${n} selected — avg HP ${Math.ceil(hp / n)}  total ${Math.ceil(hp)}/${Math.ceil(max)}  ·  RMB enemy = attack`,
      );
    }
    this.hint.setText(
      'LMB select · Shift add  ·  drag box  ·  RMB attack/move  ·  WASD pan  ·  wheel/QE zoom  ·  Esc clear',
    );
  }

  private drawUnits(): void {
    const g = this.unitGfx;
    g.clear();
    for (const u of this.world.units) {
      // Attack range ring when selected
      if (u.selected) {
        g.lineStyle(1, 0xf0c75e, 0.35);
        g.strokeCircle(u.x, u.y, u.range);
        g.lineStyle(2, 0xf0c75e, 1);
        g.strokeCircle(u.x, u.y, u.radius + 6);
      }

      // Body
      const flash = u.lastAttackFlashMs > 0;
      g.fillStyle(flash ? 0xffffff : u.color, 1);
      g.fillCircle(u.x, u.y, u.radius);
      // Team marker (dot): gold = player, purple outline already enemy color
      g.fillStyle(u.team === 'player' ? 0xf0c75e : 0xe8a0ff, 0.95);
      g.fillCircle(u.x, u.y - 5, 3.5);

      // Health bar
      const barW = 28;
      const barH = 4;
      const bx = u.x - barW / 2;
      const by = u.y - u.radius - 12;
      const pct = Math.max(0, u.hp / u.maxHp);
      g.fillStyle(0x1a1a1a, 0.75);
      g.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
      g.fillStyle(0x333333, 1);
      g.fillRect(bx, by, barW, barH);
      g.fillStyle(pct > 0.35 ? 0x5dce6a : 0xe85a5a, 1);
      g.fillRect(bx, by, barW * pct, barH);

      if (u.moveTarget && !u.attackTargetId) {
        g.lineStyle(1, 0xf0c75e, 0.45);
        g.lineBetween(u.x, u.y, u.moveTarget.x, u.moveTarget.y);
      }
      if (u.attackTargetId != null) {
        const t = this.world.units.find((o) => o.id === u.attackTargetId);
        if (t) {
          g.lineStyle(1, 0xe85a5a, 0.55);
          g.lineBetween(u.x, u.y, t.x, t.y);
        }
      }
    }
  }
}
