/**
 * Battlefield — select/move/combat + economy (gather Gold / Magic Crystals).
 * Phaser 4 APIs: https://docs.phaser.io/
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import { RESOURCES } from '../../data/resources';
import { SPECIES } from '../../data/speciesStub';
import { getBuildingType } from '../../data/buildings';
import { getUnitType } from '../../data/units';
import {
  createAiState,
  tickBattlefieldAi,
  type AiState,
} from '../../gameplay/battlefield/battlefieldAi';
import {
  buildingBlocks,
  findBuildingAt,
  placeBuilding,
  tickBuildings,
} from '../../gameplay/battlefield/battlefieldBuildings';
import {
  findEnemyAt,
  issueAttackSelected,
  livingByTeam,
  tickBattlefieldCombat,
} from '../../gameplay/battlefield/battlefieldCombat';
import {
  findNodeAt,
  issueGatherSelected,
  tickBattlefieldEconomy,
} from '../../gameplay/battlefield/battlefieldEconomy';
import {
  tickProduction,
  trainHotkey,
} from '../../gameplay/battlefield/battlefieldProduction';
import {
  clearSelection,
  createBattlefieldWorld,
  issueMoveSelected,
  selectAt,
  selectInRect,
  selectedCount,
  selectedUnits,
  tickBattlefield,
  type BattlefieldBuilding,
  type BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import { RtsCamera } from '../camera/rtsCamera';
import { createSkirmishMap } from '../maps/mapManager';

type PointerMode = 'none' | 'select' | 'box' | 'pan' | 'place';

export class BattlefieldScene extends Phaser.Scene {
  private world!: BattlefieldWorld;
  private cameraCtl!: RtsCamera;
  private boxGfx!: Phaser.GameObjects.Graphics;
  private unitGfx!: Phaser.GameObjects.Graphics;
  private ghostGfx!: Phaser.GameObjects.Graphics;
  private mode: PointerMode = 'none';
  private pointerStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  private cameraStart = { x: 0, y: 0 };
  private hint!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private resourceHud!: Phaser.GameObjects.Text;
  private shiftKey: Phaser.Input.Keyboard.Key | null = null;
  private placeType: 'bonker_hut' = 'bonker_hut';
  private ghostPos = { x: 0, y: 0 };
  private ghostValid = false;
  private selectedBuilding: BattlefieldBuilding | null = null;
  private ai!: AiState;

  constructor() {
    super('Battlefield');
  }

  create(): void {
    this.input.mouse?.disableContextMenu();

    createSkirmishMap(this);
    this.world = createBattlefieldWorld();
    this.ai = createAiState();
    this.cameraCtl = new RtsCamera(this);
    const first = this.world.units.find((u) => u.team === 'player');
    if (first) this.cameras.main.centerOn(first.x + 80, first.y - 40);

    this.boxGfx = this.add.graphics().setDepth(50);
    this.unitGfx = this.add.graphics().setDepth(10);

    this.ghostGfx = this.add.graphics().setDepth(40);

    this.add
      .text(12, 8, `${BRAND.name}  ·  Skirmish AI`, {
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
        `Species: ${species.name}  ·  Click building · 1/2 train  ·  B = hut`,
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

    this.resourceHud = this.add
      .text(12, 68, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#f5e6c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.status = this.add
      .text(12, 100, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#d7e6f2',
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
      console.warn(`[${BRAND.name}] ads should stay off`);
    }
  }

  private bindInput(): void {
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.mode === 'place') {
        this.mode = 'none';
        this.ghostGfx.clear();
      } else {
        clearSelection(this.world);
        this.clearBuildingSelection();
      }
    });
    this.input.keyboard?.on('keydown-B', () => {
      this.mode = this.mode === 'place' ? 'none' : 'place';
      if (this.mode !== 'place') this.ghostGfx.clear();
    });
    this.input.keyboard?.on('keydown-ONE', () =>
      trainHotkey(this.world, this.selectedBuilding, 0),
    );
    this.input.keyboard?.on('keydown-TWO', () =>
      trainHotkey(this.world, this.selectedBuilding, 1),
    );
    this.input.keyboard?.on('keydown-THREE', () =>
      trainHotkey(this.world, this.selectedBuilding, 2),
    );
  }

  private clearBuildingSelection(): void {
    for (const b of this.world.buildings) b.selected = false;
    this.selectedBuilding = null;
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

    if (this.mode === 'place' && pointer.leftButtonDown()) {
      if (this.ghostValid) {
        const placed = placeBuilding(
          this.world,
          'player',
          this.placeType,
          this.ghostPos.x,
          this.ghostPos.y,
        );
        if (placed) {
          this.mode = 'none';
          this.ghostGfx.clear();
        }
      }
      return;
    }

    if (pointer.middleButtonDown()) {
      this.mode = 'pan';
      return;
    }
    if (pointer.rightButtonDown()) {
      if (this.mode === 'place') {
        this.mode = 'none';
        this.ghostGfx.clear();
        return;
      }
      const enemy = findEnemyAt(this.world, wp.x, wp.y, 'player');
      const node = findNodeAt(this.world, wp.x, wp.y);
      if (enemy) issueAttackSelected(this.world, enemy);
      else if (node) issueGatherSelected(this.world, node);
      else issueMoveSelected(this.world, wp.x, wp.y);
      this.mode = 'none';
      return;
    }
    this.mode = 'select';
    this.cameraCtl.suppressPan = true;
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
    if (this.mode === 'place') {
      const def = getBuildingType(this.placeType);
      this.ghostPos = { x: wp.x, y: wp.y };
      this.ghostValid = !buildingBlocks(this.world, wp.x, wp.y, def.radius);
      this.drawGhost();
      return;
    }

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
    if (this.mode === 'place' || this.mode === 'pan') {
      if (this.mode === 'pan') this.mode = 'none';
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
      const b = findBuildingAt(this.world, wp.x, wp.y, 'player');
      if (b && !additive) {
        clearSelection(this.world);
        this.clearBuildingSelection();
        b.selected = true;
        this.selectedBuilding = b;
      } else {
        this.clearBuildingSelection();
        selectAt(this.world, wp.x, wp.y, additive);
      }
    }
    this.mode = 'none';
  }

  private drawGhost(): void {
    const def = getBuildingType(this.placeType);
    this.ghostGfx.clear();
    const color = this.ghostValid ? 0x5dce6a : 0xe85a5a;
    this.ghostGfx.lineStyle(2, color, 0.95);
    this.ghostGfx.fillStyle(color, 0.25);
    this.ghostGfx.fillCircle(this.ghostPos.x, this.ghostPos.y, def.radius);
    this.ghostGfx.strokeCircle(this.ghostPos.x, this.ghostPos.y, def.radius);
  }

  update(_t: number, delta: number): void {
    this.cameraCtl.update(delta);
    tickBattlefield(this.world, delta);
    tickBattlefieldEconomy(this.world);
    tickBuildings(this.world, delta);
    tickProduction(this.world, delta);
    tickBattlefieldAi(this.world, this.ai, delta);
    tickBattlefieldCombat(this.world, delta);
    // Drop selection if building destroyed
    if (
      this.selectedBuilding &&
      !this.world.buildings.includes(this.selectedBuilding)
    ) {
      this.selectedBuilding = null;
    }
    this.drawWorld();
    this.refreshHud();
  }

  private refreshHud(): void {
    const w = this.world.wallet;
    this.resourceHud.setText(
      `Gold ${Math.floor(w.gold)}   ·   Magic Crystals ${Math.floor(w.magic_crystals)}   (GDD: Scrap/Core)`,
    );

    const n = selectedCount(this.world);
    const sel = selectedUnits(this.world);
    const friends = livingByTeam(this.world, 'player');
    const foes = livingByTeam(this.world, 'enemy');
    const b = this.selectedBuilding;
    if (b) {
      const trains = getBuildingType(b.typeId).trains;
      const labels = trains
        .map((id, i) => {
          const d = getUnitType(id);
          return `${i + 1}:${d.name}(${d.costGold}g${d.costCrystals ? '/' + d.costCrystals + 'c' : ''})`;
        })
        .join('  ');
      const q =
        b.trainQueue.length > 0
          ? ` · queue ${b.trainQueue.length} (${Math.floor((b.trainProgressMs / getUnitType(b.trainQueue[0]!).trainMs) * 100)}%)`
          : '';
      this.status.setText(
        `${b.name}  HP ${Math.ceil(b.hp)}/${b.maxHp}${q}  ·  ${labels}`,
      );
    } else if (n === 0) {
      this.status.setText(
        `Alive ${friends} vs ${foes}  ·  Click Junkyard/Hut to train  ·  RMB gather/attack`,
      );
    } else if (n === 1) {
      const u = sel[0]!;
      const carry =
        u.carrying > 0
          ? ` · carrying ${u.carrying} ${u.carryingResource ?? ''}`
          : u.canGather
            ? ' · scavenger'
            : '';
      this.status.setText(
        `1 selected — ${u.name}  HP ${Math.ceil(u.hp)}/${u.maxHp}${carry}`,
      );
    } else {
      this.status.setText(`${n} selected  ·  RMB resource / enemy / ground`);
    }
    this.hint.setText(
      this.mode === 'place'
        ? 'Place Bonker Hut (100 Gold) · LMB place · RMB/Esc cancel · green=valid'
        : 'LMB unit/building · 1/2 train · B hut · RMB gather/attack/move · Esc clear',
    );
  }

  private drawWorld(): void {
    const g = this.unitGfx;
    g.clear();

    for (const b of this.world.buildings) {
      const alpha = b.complete ? 1 : 0.45 + 0.4 * b.buildProgress;
      g.fillStyle(b.color, alpha);
      g.fillRoundedRect(
        b.x - b.radius,
        b.y - b.radius,
        b.radius * 2,
        b.radius * 2,
        6,
      );
      g.lineStyle(2, b.selected ? 0xf0c75e : b.accent, b.selected ? 1 : 0.9);
      g.strokeRoundedRect(
        b.x - b.radius,
        b.y - b.radius,
        b.radius * 2,
        b.radius * 2,
        6,
      );
      if (b.trainQueue.length > 0) {
        const tw = b.radius * 2;
        const udef = getUnitType(b.trainQueue[0]!);
        const tp = Math.min(1, b.trainProgressMs / udef.trainMs);
        g.fillStyle(0x1a1a1a, 0.8);
        g.fillRect(b.x - b.radius, b.y + b.radius + 10, tw, 4);
        g.fillStyle(0x7ec8ff, 1);
        g.fillRect(b.x - b.radius, b.y + b.radius + 10, tw * tp, 4);
      }
      if (!b.complete) {
        const bw = b.radius * 2;
        g.fillStyle(0x222222, 0.8);
        g.fillRect(b.x - b.radius, b.y + b.radius + 4, bw, 5);
        g.fillStyle(0xf0c75e, 1);
        g.fillRect(b.x - b.radius, b.y + b.radius + 4, bw * b.buildProgress, 5);
      }
      const barW = b.radius * 2;
      const pct = Math.max(0, b.hp / b.maxHp);
      g.fillStyle(0x333333, 1);
      g.fillRect(b.x - b.radius, b.y - b.radius - 10, barW, 4);
      g.fillStyle(0x5dce6a, 1);
      g.fillRect(b.x - b.radius, b.y - b.radius - 10, barW * pct, 4);
    }

    for (const s of this.world.stockpiles) {
      g.lineStyle(1, s.team === 'player' ? 0xf0c75e : 0xc4a0e0, 0.35);
      g.strokeCircle(s.x, s.y, s.radius);
    }

    for (const n of this.world.nodes) {
      if (n.remaining <= 0) continue;
      const def = RESOURCES[n.resourceId];
      const pct = n.remaining / n.maxAmount;
      g.fillStyle(def.color, 0.35 + 0.5 * pct);
      g.fillCircle(n.x, n.y, n.radius);
      g.lineStyle(2, def.color, 1);
      g.strokeCircle(n.x, n.y, n.radius);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(n.x, n.y, 4);
    }

    for (const u of this.world.units) {
      if (u.selected) {
        g.lineStyle(1, 0xf0c75e, 0.35);
        g.strokeCircle(u.x, u.y, u.range);
        g.lineStyle(2, 0xf0c75e, 1);
        g.strokeCircle(u.x, u.y, u.radius + 6);
      }

      const flash = u.lastAttackFlashMs > 0;
      g.fillStyle(flash ? 0xffffff : u.color, 1);
      g.fillCircle(u.x, u.y, u.radius);
      g.fillStyle(u.team === 'player' ? 0xf0c75e : 0xe8a0ff, 0.95);
      g.fillCircle(u.x, u.y - 5, 3.5);

      if (u.carrying > 0 && u.carryingResource) {
        g.fillStyle(RESOURCES[u.carryingResource].color, 1);
        g.fillCircle(u.x + 8, u.y - 8, 5);
      }

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
        const t =
          this.world.units.find((o) => o.id === u.attackTargetId) ??
          this.world.buildings.find((o) => o.id === u.attackTargetId);
        if (t) {
          g.lineStyle(1, 0xe85a5a, 0.55);
          g.lineBetween(u.x, u.y, t.x, t.y);
        }
      }
    }
  }
}
