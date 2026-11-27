/**
 * Mid-screen victory-hold countdown when a side owns enough CORE fragments.
 * Clock is remaining whole seconds (hold is ≤60s) so it reads at a glance.
 */
import Phaser from 'phaser';
import {
  coreHoldBannerState,
  type CoreHoldBannerState,
} from '../../gameplay/battlefield/battlefieldCoreFragments';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';

/** Remaining whole seconds until hold win (ceil; never negative). */
export function coreHoldRemainSec(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

/** Hold progress 0 at start → 1 at win. */
export function coreHoldProgress(remainMs: number, totalMs: number): number {
  if (totalMs <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainMs / totalMs));
}

const CLOCK_TICK_MS = 180;
const PANEL_H = 76;

/**
 * Desktop keeps the banner under the match timer.
 * A short screen drops it below the stock strip (same band as layoutStockStrip).
 */
export function coreBannerCenterY(width: number, height: number): number {
  if (height >= 500) return 58;
  const narrow = width < 720;
  const pad = narrow ? 8 : 12;
  const stripTop = pad + (narrow ? 50 : 60);
  return stripTop + 36 + 8 + PANEL_H / 2;
}

/** Bottom edge of the hold banner panel. */
export function coreBannerBottom(width: number, height: number): number {
  return coreBannerCenterY(width, height) + PANEL_H / 2;
}

/**
 * Top of the left chip stack (idle, attack, scout, status).
 * Tall screens keep it under the resource band.
 * Short screens start below the CORE hold banner while it is showing.
 */
export function hudChipStackTop(
  width: number,
  height: number,
  bannerVisible = true,
): number {
  const narrow = width < 720;
  const pad = narrow ? 8 : 12;
  const resY = pad + (narrow ? 50 : 60);
  const resH = narrow && height >= 500 ? 80 : 36;
  const belowRes = resY + resH + 8;
  if (height >= 500 || !bannerVisible) return belowRes;
  return Math.max(belowRes, coreBannerBottom(width, height) + 8);
}

/** How far the left chips drop while the place-cost strip is on screen. */
export const PLACE_COST_BLOCK_H = 40;

/**
 * Top of the building place-cost strip.
 * Tall screens keep it under the match clock.
 * Short screens park it at the top of the chip stack, which drops under
 * the CORE banner while that banner is showing.
 */
export function placeCostStripTop(
  width: number,
  height: number,
  bannerVisible = true,
): number {
  const narrow = width < 720;
  const pad = narrow ? 8 : 12;
  if (height >= 500) return pad + (narrow ? 34 : 40);
  return hudChipStackTop(width, height, bannerVisible);
}

export class CoreVictoryBanner {
  private readonly scene: Phaser.Scene;
  private readonly world: BattlefieldWorld;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly barBg: Phaser.GameObjects.Rectangle;
  private readonly barFill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly clock: Phaser.GameObjects.Text;
  private readonly sub: Phaser.GameObjects.Text;
  private pulseMs = 0;
  private lastRemainSec = -1;
  private tickMs = 0;
  private panelW = 0;

  constructor(scene: Phaser.Scene, world: BattlefieldWorld) {
    this.scene = scene;
    this.world = world;
    const w = Math.min(420, scene.scale.width - 32);

    this.panel = scene.add
      .rectangle(0, 0, w, PANEL_H, 0x122033, 0.92)
      .setStrokeStyle(2, 0xf0c75e, 0.95)
      .setScrollFactor(0)
      .setDepth(118)
      .setVisible(false);

    this.barBg = scene.add
      .rectangle(0, 0, w - 28, 5, 0x0a121c, 0.9)
      .setScrollFactor(0)
      .setDepth(119)
      .setVisible(false)
      .setOrigin(0, 0.5);

    this.barFill = scene.add
      .rectangle(0, 0, w - 28, 5, 0xf0c75e, 0.95)
      .setScrollFactor(0)
      .setDepth(120)
      .setVisible(false)
      .setOrigin(0, 0.5);

    this.label = scene.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#f0c75e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(119)
      .setVisible(false);

    this.clock = scene.add
      .text(0, 0, '', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '26px',
        color: '#fff8e8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(119)
      .setVisible(false);

    this.sub = scene.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#c8d8e8',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(119)
      .setVisible(false);

    this.layout();
  }

  hide(): void {
    for (const obj of this.gameObjects()) {
      if ('setVisible' in obj) {
        (obj as Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void }).setVisible(false);
      }
    }
  }

  gameObjects(): Phaser.GameObjects.GameObject[] {
    return [
      this.panel,
      this.barBg,
      this.barFill,
      this.label,
      this.clock,
      this.sub,
    ];
  }

  layout(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const panelW = Math.min(420, w - 32);
    this.panelW = panelW;
    const x = w / 2;
    const y = coreBannerCenterY(w, h);
    this.panel.setSize(panelW, PANEL_H).setPosition(x, y);
    this.label.setPosition(x, y - 18);
    this.clock.setPosition(x, y);
    this.sub.setPosition(x, y + 16);
    const barW = panelW - 28;
    this.barBg.setSize(barW, 5).setPosition(x - barW / 2, y + 30);
    this.barFill.setPosition(x - barW / 2, y + 30);
  }

  refresh(dtMs = 16): void {
    const state = coreHoldBannerState(this.world);
    this.apply(state, dtMs);
  }

  private apply(state: CoreHoldBannerState, dtMs: number): void {
    if (!state.visible || !state.side) {
      this.panel.setVisible(false);
      this.barBg.setVisible(false);
      this.barFill.setVisible(false);
      this.label.setVisible(false);
      this.clock.setVisible(false);
      this.sub.setVisible(false);
      this.pulseMs = 0;
      this.lastRemainSec = -1;
      this.tickMs = 0;
      this.clock.setScale(1);
      return;
    }

    this.pulseMs += dtMs;
    const remainSec = coreHoldRemainSec(state.remainMs);
    if (remainSec !== this.lastRemainSec) {
      this.lastRemainSec = remainSec;
      this.tickMs = CLOCK_TICK_MS;
    }
    if (this.tickMs > 0) {
      this.tickMs = Math.max(0, this.tickMs - dtMs);
      const tick = this.tickMs / CLOCK_TICK_MS;
      this.clock.setScale(1 + 0.1 * tick);
    } else {
      this.clock.setScale(1);
    }

    const urgent = state.remainMs <= 10_000;
    const pulse = urgent
      ? 0.82 + 0.18 * Math.sin(this.pulseMs / 180)
      : 0.92 + 0.08 * Math.sin(this.pulseMs / 420);

    const player = state.side === 'player';
    const stroke = player ? 0xf0c75e : 0xe87aa8;
    const fill = player ? 0xf0c75e : 0xe87aa8;
    const labelColor = player ? '#f0c75e' : '#e87aa8';
    const clockColor = urgent ? (player ? '#fff0c0' : '#ffd0e0') : '#fff8e8';
    const progress = coreHoldProgress(state.remainMs, state.totalMs);
    const barW = Math.max(0, this.panelW - 28);

    this.panel
      .setVisible(true)
      .setStrokeStyle(2.5, stroke, pulse)
      .setFillStyle(player ? 0x1a2818 : 0x281018, 0.92);
    this.barBg.setVisible(true).setSize(barW, 5);
    this.barFill
      .setVisible(true)
      .setFillStyle(fill, 0.95)
      .setSize(Math.max(2, barW * progress), 5);
    this.label
      .setVisible(true)
      .setColor(labelColor)
      .setText(
        player
          ? t('core.victoryHold', {
              owned: state.owned,
              needed: state.needed,
            })
          : t('core.enemyHold', {
              owned: state.owned,
              needed: state.needed,
            }),
      );
    this.clock
      .setVisible(true)
      .setColor(clockColor)
      .setAlpha(pulse)
      .setText(t('banner.coreHoldSec', { n: remainSec }));
    this.sub
      .setVisible(true)
      .setColor(urgent ? clockColor : '#c8d8e8')
      .setAlpha(Math.min(1, pulse + 0.05))
      .setText(t('banner.coreHoldLeft', { n: remainSec }));
  }
}
