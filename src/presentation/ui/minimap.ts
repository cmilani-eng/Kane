/**
 * Battlefield minimap — unit/building dots + click-to-pan.
 * Drawn with scrollFactor 0 for the HUD camera.
 * Emphasizes camera frame, selection, and order pings (touch-friendly).
 */
import Phaser from 'phaser';
import { MAP } from '../../config/balance';
import { flags } from '../../config/flags';
import { livingByTeam } from '../../gameplay/battlefield/battlefieldCombat';
import {
  enemyRevealed,
  isExplored,
} from '../../gameplay/battlefield/battlefieldFog';
import {
  attentionPingFade,
  attentionPingOnCooldown,
  spawnAttentionPing,
} from '../../gameplay/battlefield/battlefieldAttentionPing';
import {
  MINIMAP_DOUBLE_TAP_MS,
  selectionOrOrderFocus,
} from '../../gameplay/battlefield/battlefieldMinimapFocus';
import { buildingCanRally } from '../../gameplay/battlefield/battlefieldRally';
import {
  countIdleWorkers,
  countLivingWorkers,
  isIdleWorker,
} from '../../gameplay/battlefield/idleWorkers';
import { isMilitaryUnit } from '../../gameplay/battlefield/selectMilitary';
import {
  TOUCH_LONG_PRESS_MS,
  TOUCH_LONG_PRESS_SLOP_PX,
  touchLongPressAction,
} from '../../gameplay/battlefield/touchLongPress';
import type {
  BattlefieldBuilding,
  BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import type { RtsCamera } from '../camera/rtsCamera';
import { playSfx } from '../audio/sfx';
import { MOBILE_PERF } from '../perf/mobileBudget';
import {
  MINIMAP_FOCUS_FLASH_MS,
  minimapFocusFlashAlpha,
} from './minimapFocusFlash';
import {
  ATTENTION_PING_COOLDOWN_MS,
  MINIMAP_PING_DENY_FLASH_MS,
  minimapPingDenyFlashAlpha,
} from './minimapPingCooldown';
import { minimapSelectedUnitBlip } from './minimapSelectedBlip';
import { minimapCameraViewportLabelText } from './minimapCameraViewportLabel';
import {
  minimapCameraSectorAt,
  minimapCameraSectorTipText,
} from './minimapCameraSectorTip';
import { minimapPingAgeTip } from './minimapPingAgeTip';
import { minimapPingSectorTipAlpha } from './minimapPingSectorTip';
import { minimapFogRevealAgeTip } from './minimapFogRevealAgeTip';
import { minimapScoutPulseLabelAlpha } from './minimapScoutPulseLabel';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';
import { minimapWorkerCountTipText } from './minimapWorkerCountTip';
import {
  minimapHeroStatus,
  minimapHeroStatusTipText,
} from './minimapHeroStatusTip';
import {
  fogExploredCoveragePct,
  minimapFogCoverageTipText,
} from './minimapFogCoverageTip';
import { minimapCrystalStockTipText } from './minimapCrystalStockTip';
import { minimapGoldStockTipText } from './minimapGoldStockTip';
import { minimapMatchClockTipText } from './minimapMatchClockTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { minimapSupplyTipText } from './minimapSupplyTip';
import { walletOf } from '../../gameplay/battlefield/battlefieldEconomy';

export class Minimap {
  private readonly scene: Phaser.Scene;
  private readonly world: BattlefieldWorld;
  private readonly cameraCtl: RtsCamera;
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly hit: Phaser.GameObjects.Rectangle;
  private readonly frame: Phaser.GameObjects.Rectangle;
  /** Short sector label when fog scout pulse lands. */
  private readonly scoutLabel: Phaser.GameObjects.Text;
  /** Short sector tip when an attention ping lands. */
  private readonly pingSectorLabel: Phaser.GameObjects.Text;
  /** Short mark on the camera viewport frame. */
  private readonly camLabel: Phaser.GameObjects.Text;
  /** 3×3 sector tip for the camera view center (distinct from View). */
  private readonly camSectorLabel: Phaser.GameObjects.Text;
  /** Live supply usage tip on the minimap chrome. */
  private readonly supplyLabel: Phaser.GameObjects.Text;
  /** Live population tip on the minimap chrome. */
  private readonly popLabel: Phaser.GameObjects.Text;
  /** Live idle-worker count tip on the minimap chrome. */
  private readonly idleLabel: Phaser.GameObjects.Text;
  /** Live army (combat) count tip on the minimap chrome. */
  private readonly armyLabel: Phaser.GameObjects.Text;
  /** Live living-worker count tip on the minimap chrome. */
  private readonly workersLabel: Phaser.GameObjects.Text;
  /** Live building count tip on the minimap chrome. */
  private readonly buildingsLabel: Phaser.GameObjects.Text;
  /** Live hero status tip on the minimap chrome. */
  private readonly heroLabel: Phaser.GameObjects.Text;
  /** Live fog explored-coverage tip on the minimap chrome. */
  private readonly fogLabel: Phaser.GameObjects.Text;
  /** Live selected-unit count tip on the minimap chrome. */
  private readonly selectedLabel: Phaser.GameObjects.Text;
  /** Live gold-stock tip on the minimap chrome. */
  private readonly goldLabel: Phaser.GameObjects.Text;
  /** Live crystal-stock tip on the minimap chrome. */
  private readonly crystalLabel: Phaser.GameObjects.Text;
  /** Live match-clock tip on the minimap chrome. */
  private readonly clockLabel: Phaser.GameObjects.Text;
  /** Match elapsed ms for the Time · tip (set from scene each refresh). */
  private matchElapsedMs = 0;

  private mapX = 0;
  private mapY = 0;
  private mapW = 180;
  private mapH = 120;
  /** Extra padding around the map for fat-finger pan. */
  private hitPad = 10;
  private dragging = false;
  private dragMoved = false;
  private lastTapMs = 0;
  private selectedBuilding: BattlefieldBuilding | null = null;
  private pulseMs = 0;
  /** Extra lift when DOM selection panel is open. */
  private bottomInset = 0;
  /** Minimap hold → attention ping (chat-free mark). */
  private holdTimer: Phaser.Time.TimerEvent | null = null;
  private holdStartX = 0;
  private holdStartY = 0;
  /** Remaining ms of double-tap recenter flash. */
  private focusFlashMs = 0;
  /** Remaining ms before another hold-to-ping is allowed. */
  private pingCooldownMs = 0;
  /** Remaining ms of ice flash when ping is refused on cooldown. */
  private pingDenyFlashMs = 0;

  constructor(
    scene: Phaser.Scene,
    world: BattlefieldWorld,
    cameraCtl: RtsCamera,
  ) {
    this.scene = scene;
    this.world = world;
    this.cameraCtl = cameraCtl;

    this.frame = scene.add
      .rectangle(0, 0, this.mapW + 8, this.mapH + 8, 0x0f1a2e, 0.9)
      .setStrokeStyle(2, 0xf0c75e, 0.9)
      .setScrollFactor(0)
      .setDepth(110)
      .setOrigin(0, 0);

    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(111);

    this.scoutLabel = scene.add
      .text(0, 0, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '11px',
        color: '#b8e8ff',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 1)
      .setVisible(false);

    this.pingSectorLabel = scene.add
      .text(0, 0, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '11px',
        color: '#e8f4ff',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 1)
      .setVisible(false);

    this.camLabel = scene.add
      .text(0, 0, minimapCameraViewportLabelText(), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#f0c75e',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 1)
      .setAlpha(0.9);

    this.camSectorLabel = scene.add
      .text(0, 0, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#f5e6c8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.supplyLabel = scene.add
      .text(0, 0, minimapSupplyTipText(0, flags.unitCap), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.popLabel = scene.add
      .text(0, 0, minimapPopulationTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.idleLabel = scene.add
      .text(0, 0, minimapIdleWorkerTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#f0c75e',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9)
      .setVisible(false);

    this.armyLabel = scene.add
      .text(0, 0, minimapArmyCountTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.workersLabel = scene.add
      .text(0, 0, minimapWorkerCountTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.buildingsLabel = scene.add
      .text(0, 0, minimapBuildingCountTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.heroLabel = scene.add
      .text(0, 0, minimapHeroStatusTipText({ kind: 'ready' }), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.fogLabel = scene.add
      .text(0, 0, minimapFogCoverageTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.selectedLabel = scene.add
      .text(0, 0, minimapSelectedCountTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.goldLabel = scene.add
      .text(0, 0, minimapGoldStockTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.crystalLabel = scene.add
      .text(0, 0, minimapCrystalStockTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.clockLabel = scene.add
      .text(0, 0, minimapMatchClockTipText(0), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#c8d8e8',
        stroke: '#0a1018',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(113)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.hit = scene.add
      .rectangle(0, 0, this.mapW, this.mapH, 0x000000, 0.001)
      .setScrollFactor(0)
      .setDepth(112)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });

    this.hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const now = this.scene.time.now;
      const quick =
        this.lastTapMs > 0 &&
        now - this.lastTapMs <= MINIMAP_DOUBLE_TAP_MS &&
        !this.dragMoved;
      this.lastTapMs = now;
      this.dragMoved = false;

      if (quick) {
        this.clearHoldPing();
        const focus = selectionOrOrderFocus(
          this.world,
          this.selectedBuilding,
        );
        if (focus) {
          this.dragging = false;
          this.cameraCtl.centerOn(focus.x, focus.y);
          this.focusFlashMs = MINIMAP_FOCUS_FLASH_MS;
          playSfx('ui');
          // Consume the double so a third tap starts a fresh pair.
          this.lastTapMs = 0;
          return;
        }
      }

      this.dragging = true;
      this.panToPointer(p);
      playSfx('ui');
      this.beginHoldPing(p);
    });
    this.hit.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragging && p.isDown) {
        const moved = Math.hypot(p.x - this.holdStartX, p.y - this.holdStartY);
        if (moved > TOUCH_LONG_PRESS_SLOP_PX) {
          this.dragMoved = true;
          this.clearHoldPing();
        }
        this.panToPointer(p);
      }
    });
    this.hit.on('pointerup', () => {
      this.dragging = false;
      this.clearHoldPing();
    });
    this.hit.on('pointerout', () => {
      this.dragging = false;
      this.clearHoldPing();
    });

    this.layout();
    scene.scale.on('resize', () => this.layout());
  }

  objects(): Phaser.GameObjects.GameObject[] {
    return [
      this.frame,
      this.gfx,
      this.hit,
      this.scoutLabel,
      this.pingSectorLabel,
      this.camLabel,
      this.camSectorLabel,
      this.supplyLabel,
      this.popLabel,
      this.idleLabel,
      this.armyLabel,
      this.workersLabel,
      this.buildingsLabel,
      this.heroLabel,
      this.fogLabel,
      this.selectedLabel,
      this.goldLabel,
      this.crystalLabel,
      this.clockLabel,
    ];
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
    const short = sh < 500;
    // Landscape phones keep the map small so it stays off the ability pads.
    this.mapW = short ? Math.min(120, sw * 0.22) : narrow ? Math.min(168, sw * 0.42) : 196;
    this.mapH = (this.mapW * MAP.height) / MAP.width;
    this.hitPad = narrow || short ? 14 : 10;
    const pad = narrow || short ? 8 : 12;
    this.mapX = sw - pad - this.mapW;
    this.mapY =
      sh - pad - this.mapH - (short ? 52 : narrow ? 70 : 78) - this.bottomInset;

    this.frame
      .setSize(this.mapW + 10, this.mapH + 10)
      .setPosition(this.mapX - 5, this.mapY - 5)
      .setStrokeStyle(2.5, 0xf0c75e, 0.95);
    // Fat-finger hit box extends beyond the painted map.
    this.hit
      .setSize(this.mapW + this.hitPad * 2, this.mapH + this.hitPad * 2)
      .setPosition(this.mapX - this.hitPad, this.mapY - this.hitPad);
  }

  private panToPointer(p: Phaser.Input.Pointer): void {
    const { wx, wy } = this.worldFromPointer(p);
    this.cameraCtl.centerOn(wx, wy);
  }

  private worldFromPointer(p: Phaser.Input.Pointer): { wx: number; wy: number } {
    const lx = Phaser.Math.Clamp(p.x - this.mapX, 0, this.mapW);
    const ly = Phaser.Math.Clamp(p.y - this.mapY, 0, this.mapH);
    return {
      wx: (lx / this.mapW) * MAP.width,
      wy: (ly / this.mapH) * MAP.height,
    };
  }

  private beginHoldPing(p: Phaser.Input.Pointer): void {
    this.clearHoldPing();
    this.holdStartX = p.x;
    this.holdStartY = p.y;
    this.holdTimer = this.scene.time.delayedCall(TOUCH_LONG_PRESS_MS, () => {
      this.holdTimer = null;
      if (this.dragMoved) return;
      const ptr = this.scene.input.activePointer;
      const px = ptr?.x ?? this.holdStartX;
      const py = ptr?.y ?? this.holdStartY;
      const moved = Math.hypot(px - this.holdStartX, py - this.holdStartY);
      if (touchLongPressAction(TOUCH_LONG_PRESS_MS, moved) !== 'order') {
        return;
      }
      if (attentionPingOnCooldown(this.pingCooldownMs)) {
        this.pingDenyFlashMs = MINIMAP_PING_DENY_FLASH_MS;
        playSfx('ui');
        return;
      }
      const { wx, wy } = this.worldFromPointer({
        x: px,
        y: py,
      } as Phaser.Input.Pointer);
      spawnAttentionPing(this.world, wx, wy);
      this.pingCooldownMs = ATTENTION_PING_COOLDOWN_MS;
      playSfx('ui');
    });
  }

  private clearHoldPing(): void {
    this.holdTimer?.remove(false);
    this.holdTimer = null;
  }

  private refreshAcc = 999;

  /** Throttled redraw — call every frame; paints on cadence. */
  refresh(
    dtMs = 16,
    selectedBuilding: BattlefieldBuilding | null = null,
    matchElapsedMs = 0,
  ): void {
    this.selectedBuilding = selectedBuilding;
    this.matchElapsedMs = Math.max(0, matchElapsedMs);
    this.pulseMs += dtMs;
    if (this.pingCooldownMs > 0) {
      this.pingCooldownMs = Math.max(0, this.pingCooldownMs - dtMs);
    }
    if (this.focusFlashMs > 0) {
      this.focusFlashMs = Math.max(0, this.focusFlashMs - dtMs);
      // Keep redrawing while the flash fades.
      this.refreshAcc = MOBILE_PERF.minimapMs;
    }
    if (this.pingDenyFlashMs > 0) {
      this.pingDenyFlashMs = Math.max(0, this.pingDenyFlashMs - dtMs);
      this.refreshAcc = MOBILE_PERF.minimapMs;
    }
    if ((this.world.scoutSectorHint?.lifeMs ?? 0) > 0) {
      // Keep redrawing while the scout label fades.
      this.refreshAcc = MOBILE_PERF.minimapMs;
    }
    this.refreshAcc += dtMs;
    if (this.refreshAcc < MOBILE_PERF.minimapMs) return;
    this.refreshAcc = 0;
    this.redraw();
  }

  private redraw(): void {
    const g = this.gfx;
    g.clear();

    const flash = minimapFocusFlashAlpha(this.focusFlashMs);
    const deny = minimapPingDenyFlashAlpha(this.pingDenyFlashMs);
    this.frame.setStrokeStyle(
      flash > 0 || deny > 0 ? 2.75 : 2,
      deny > 0 ? 0x7ec8ff : flash > 0 ? 0xfff8e8 : 0xf0c75e,
      flash > 0 ? 0.55 + 0.45 * flash : 0.9,
    );

    // Terrain fill (explored tint)
    g.fillStyle(0x0a1018, 1);
    g.fillRect(this.mapX, this.mapY, this.mapW, this.mapH);
    if (flash > 0) {
      g.fillStyle(0xf0c75e, 0.2 * flash);
      g.fillRect(this.mapX, this.mapY, this.mapW, this.mapH);
    }

    const sx = this.mapW / MAP.width;
    const sy = this.mapH / MAP.height;
    const fog = this.world.fog;
    const selPulse = 0.55 + 0.35 * Math.sin(this.pulseMs / 220);
    const orderPulse = 0.45 + 0.4 * Math.sin(this.pulseMs / 160);

    // Explored / visible terrain samples (coarse — cheap)
    const step = 80;
    for (let wy = step / 2; wy < MAP.height; wy += step) {
      for (let wx = step / 2; wx < MAP.width; wx += step) {
        if (!isExplored(fog, wx, wy)) continue;
        const x = this.mapX + wx * sx;
        const y = this.mapY + wy * sy;
        const vis = enemyRevealed(fog, wx, wy);
        g.fillStyle(vis ? 0x1a2a28 : 0x121a22, 1);
        g.fillRect(
          x - step * sx * 0.5,
          y - step * sy * 0.5,
          step * sx + 1,
          step * sy + 1,
        );
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
      const selected = !!b.selected;
      if (selected) {
        g.lineStyle(2, 0xfff8e8, selPulse);
        g.strokeRect(x - 5, y - 5, 10, 10);
      }
      g.fillStyle(player ? 0xf0c75e : 0xe87aa8, 1);
      g.fillRect(x - (selected ? 4 : 3), y - (selected ? 4 : 3), selected ? 8 : 6, selected ? 8 : 6);

      // Rally ping for selected production buildings
      if (selected && player && buildingCanRally(b)) {
        const rx = this.mapX + b.rallyX * sx;
        const ry = this.mapY + b.rallyY * sy;
        g.lineStyle(1.5, 0xf0c75e, orderPulse);
        g.strokeCircle(rx, ry, 5);
        g.fillStyle(0xf0c75e, 0.85);
        g.fillCircle(rx, ry, 2.2);
        g.lineStyle(1, 0xf0c75e, 0.35);
        g.lineBetween(x, y, rx, ry);
      }
    }

    // Units — unselected base dots (+ idle rings); selected drawn last on top
    const idlePulse = 0.35 + 0.25 * Math.sin(this.pulseMs / 850);
    for (const u of this.world.units) {
      if (u.hp <= 0 || u.selected) continue;
      if (u.team === 'enemy' && !enemyRevealed(fog, u.x, u.y)) continue;
      const x = this.mapX + u.x * sx;
      const y = this.mapY + u.y * sy;
      const player = u.team === 'player';
      if (isIdleWorker(u)) {
        g.lineStyle(1.5, u.carrying > 0 ? 0xffc857 : 0xf0c75e, idlePulse);
        g.strokeCircle(x, y, 5.5);
      }
      g.fillStyle(player ? 0x5dce6a : 0xe85a5a, 1);
      g.fillCircle(x, y, 2.4);
    }

    // Order pings — move / attack-move waypoints
    for (const m of this.world.waypointMarkers ?? []) {
      const x = this.mapX + m.x * sx;
      const y = this.mapY + m.y * sy;
      const atk = m.kind === 'attackMove';
      const col = atk ? 0xe85a5a : 0xf0c75e;
      const a = m.fading
        ? Math.max(0.15, m.lifeMs / m.maxLifeMs) * 0.7
        : orderPulse;
      g.lineStyle(2, col, a);
      g.strokeCircle(x, y, atk ? 7 : 6);
      g.fillStyle(col, a * 0.85);
      g.fillCircle(x, y, 2.4);
      if (atk) {
        // Small diamond tip for attack-move
        g.fillTriangle(x, y - 8, x + 3.5, y - 3, x - 3.5, y - 3);
      }
    }

    // Attention pings — chat-free look-here marks (fade with remaining life)
    for (const m of this.world.attentionPings ?? []) {
      const life = attentionPingFade(m.lifeMs, m.maxLifeMs);
      if (life < 0.02) continue;
      const x = this.mapX + m.x * sx;
      const y = this.mapY + m.y * sy;
      // Pulse damps with life so the expiry reads as a fade, not a hard pop.
      const attnPulse = 0.55 + 0.35 * Math.sin(this.pulseMs / 140) * life;
      const a = attnPulse * life;
      const r = 7.5 + (1 - life) * 2.5;
      g.lineStyle(2.25, 0xb8e8ff, a);
      g.strokeCircle(x, y, r);
      g.fillStyle(0xfff8e8, a * 0.9);
      g.fillCircle(x, y, 2.6 * Math.max(0.35, life));
    }

    // Fog scout reveal pulses — ice rings + short sector label on the minimap
    for (const fx of this.world.scoutPulses ?? []) {
      const life = Math.max(0.05, fx.lifeMs / fx.maxLifeMs);
      const x = this.mapX + fx.x * sx;
      const y = this.mapY + fx.y * sy;
      const a = life * 0.75;
      g.lineStyle(1.5, 0x7ec8ff, a);
      g.strokeCircle(x, y, 4 + (1 - life) * 3);
    }
    const hint = this.world.scoutSectorHint;
    if (hint && hint.lifeMs > 0) {
      const x = Phaser.Math.Clamp(
        this.mapX + hint.x * sx,
        this.mapX + 10,
        this.mapX + this.mapW - 10,
      );
      const y = Phaser.Math.Clamp(
        this.mapY + hint.y * sy,
        this.mapY + 12,
        this.mapY + this.mapH - 2,
      );
      this.scoutLabel
        .setText(minimapFogRevealAgeTip(hint.sector, hint.lifeMs))
        .setPosition(x, y - 6)
        .setAlpha(minimapScoutPulseLabelAlpha(hint.lifeMs))
        .setVisible(true);
    } else {
      this.scoutLabel.setVisible(false).setAlpha(1);
    }

    const pingHint = this.world.attentionPingSectorHint;
    if (pingHint && pingHint.lifeMs > 0) {
      const x = Phaser.Math.Clamp(
        this.mapX + pingHint.x * sx,
        this.mapX + 10,
        this.mapX + this.mapW - 10,
      );
      const y = Phaser.Math.Clamp(
        this.mapY + pingHint.y * sy,
        this.mapY + 12,
        this.mapY + this.mapH - 2,
      );
      this.pingSectorLabel
        .setText(minimapPingAgeTip(pingHint.sector, pingHint.lifeMs))
        .setPosition(x, y - 6)
        .setAlpha(minimapPingSectorTipAlpha(pingHint.lifeMs))
        .setVisible(true);
    } else {
      this.pingSectorLabel.setVisible(false).setAlpha(1);
    }

    // Camera viewport — gold frame + soft fill so it reads at a glance
    const cam = this.scene.cameras.main;
    const vw = cam.width / cam.zoom;
    const vh = cam.height / cam.zoom;
    const vx = this.mapX + cam.scrollX * sx;
    const vy = this.mapY + cam.scrollY * sy;
    const vwM = vw * sx;
    const vhM = vh * sy;
    g.fillStyle(0xf0c75e, 0.08);
    g.fillRect(vx, vy, vwM, vhM);
    g.lineStyle(2.5, 0xf0c75e, 0.95);
    g.strokeRect(vx, vy, vwM, vhM);
    g.lineStyle(1, 0xfff8e8, 0.55);
    g.strokeRect(vx + 1.5, vy + 1.5, Math.max(0, vwM - 3), Math.max(0, vhM - 3));
    // Short View mark at the top of the camera frame
    const camLabelX = Phaser.Math.Clamp(
      vx + vwM / 2,
      this.mapX + 10,
      this.mapX + this.mapW - 10,
    );
    const camLabelY = Phaser.Math.Clamp(
      vy - 2,
      this.mapY + 10,
      this.mapY + this.mapH - 2,
    );
    this.camLabel
      .setText(minimapCameraViewportLabelText())
      .setPosition(camLabelX, camLabelY)
      .setVisible(true);
    // Cam · sector tip at the bottom of the camera frame (view-center 3×3)
    const camSector = minimapCameraSectorAt(
      cam.scrollX,
      cam.scrollY,
      vw,
      vh,
    );
    const camSectorY = Phaser.Math.Clamp(
      vy + vhM + 2,
      this.mapY + 2,
      this.mapY + this.mapH - 10,
    );
    this.camSectorLabel
      .setText(minimapCameraSectorTipText(camSector))
      .setPosition(camLabelX, camSectorY)
      .setVisible(true);

    // Time · mm:ss on the minimap chrome (below the map frame)
    this.clockLabel
      .setText(minimapMatchClockTipText(this.matchElapsedMs))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 4)
      .setVisible(true);

    // Supply · used/cap under clock
    const pop = livingByTeam(this.world, 'player');
    this.supplyLabel
      .setText(minimapSupplyTipText(pop, flags.unitCap))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 16)
      .setVisible(true);

    // Pop · n under supply (living player units; distinct from Supply used/cap)
    this.popLabel
      .setText(minimapPopulationTipText(pop))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 28)
      .setVisible(true);

    // Army · n under pop (living player combat units)
    let armyN = 0;
    for (const u of this.world.units) {
      if (isMilitaryUnit(u)) armyN++;
    }
    this.armyLabel
      .setText(minimapArmyCountTipText(armyN))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 40)
      .setVisible(true);

    // Workers · n under army (living player gatherers; distinct from Idle)
    this.workersLabel
      .setText(minimapWorkerCountTipText(countLivingWorkers(this.world)))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 52)
      .setVisible(true);

    // Buildings · n under workers (living player buildings)
    let bldN = 0;
    for (const b of this.world.buildings) {
      if (b.team === 'player' && b.hp > 0) bldN++;
    }
    this.buildingsLabel
      .setText(minimapBuildingCountTipText(bldN))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 64)
      .setVisible(true);

    // Hero · Ready / Down / sector under buildings
    const heroStatus = minimapHeroStatus(this.world);
    this.heroLabel
      .setText(minimapHeroStatusTipText(heroStatus))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 76)
      .setVisible(true);

    // Fog · pct% under hero (explored coverage of the fog grid)
    this.fogLabel
      .setText(
        minimapFogCoverageTipText(fogExploredCoveragePct(this.world.fog)),
      )
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 88)
      .setVisible(true);

    // Selected · n under fog (living player units currently selected)
    let selN = 0;
    for (const u of this.world.units) {
      if (u.selected && u.team === 'player' && u.hp > 0) selN++;
    }
    this.selectedLabel
      .setText(minimapSelectedCountTipText(selN))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 100)
      .setVisible(true);

    // Gold · n under selected (player gold wallet; pairs with Crystal)
    const wallet = walletOf(this.world, 'player');
    this.goldLabel
      .setText(minimapGoldStockTipText(wallet.gold))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 112)
      .setVisible(true);

    // Crystal · n under gold (player magic_crystals wallet)
    this.crystalLabel
      .setText(minimapCrystalStockTipText(wallet.magic_crystals))
      .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 124)
      .setVisible(true);

    // Idle · n under crystal when any gatherer is idle
    const idleN = countIdleWorkers(this.world);
    if (idleN > 0) {
      this.idleLabel
        .setText(minimapIdleWorkerTipText(idleN))
        .setPosition(this.mapX + this.mapW / 2, this.mapY + this.mapH + 136)
        .setVisible(true);
    } else {
      this.idleLabel.setVisible(false);
    }

    // Selected unit blips — on top of camera/order so selection never hides
    for (const u of this.world.units) {
      if (u.hp <= 0 || !u.selected) continue;
      if (u.team === 'enemy' && !enemyRevealed(fog, u.x, u.y)) continue;
      const x = this.mapX + u.x * sx;
      const y = this.mapY + u.y * sy;
      const blip = minimapSelectedUnitBlip(u.team === 'player');
      if (isIdleWorker(u)) {
        g.lineStyle(1.5, u.carrying > 0 ? 0xffc857 : 0xf0c75e, idlePulse);
        g.strokeCircle(x, y, 5.5);
      }
      g.lineStyle(2, blip.ring, selPulse);
      g.strokeCircle(x, y, blip.ringR);
      g.fillStyle(blip.fill, 1);
      g.fillCircle(x, y, blip.r);
    }
  }
}
