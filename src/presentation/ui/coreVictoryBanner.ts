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

export class CoreVictoryBanner {
  private readonly scene: Phaser.Scene;
  private readonly world: BattlefieldWorld;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly clock: Phaser.GameObjects.Text;
  private readonly sub: Phaser.GameObjects.Text;
  private pulseMs = 0;

  constructor(scene: Phaser.Scene, world: BattlefieldWorld) {
    this.scene = scene;
    this.world = world;
    const w = Math.min(420, scene.scale.width - 32);

    this.panel = scene.add
      .rectangle(0, 0, w, 68, 0x122033, 0.92)
      .setStrokeStyle(2, 0xf0c75e, 0.95)
      .setScrollFactor(0)
      .setDepth(118)
      .setVisible(false);

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

  gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.panel, this.label, this.clock, this.sub];
  }

  layout(): void {
    const w = this.scene.scale.width;
    const panelW = Math.min(420, w - 32);
    const x = w / 2;
    // Sit under the match timer, above combat focus.
    const y = 58;
    this.panel.setSize(panelW, 68).setPosition(x, y);
    this.label.setPosition(x, y - 14);
    this.clock.setPosition(x, y + 4);
    this.sub.setPosition(x, y + 20);
  }

  refresh(dtMs = 16): void {
    const state = coreHoldBannerState(this.world);
    this.apply(state, dtMs);
  }

  private apply(state: CoreHoldBannerState, dtMs: number): void {
    if (!state.visible || !state.side) {
      this.panel.setVisible(false);
      this.label.setVisible(false);
      this.clock.setVisible(false);
      this.sub.setVisible(false);
      this.pulseMs = 0;
      return;
    }

    this.pulseMs += dtMs;
    const remainSec = coreHoldRemainSec(state.remainMs);
    const urgent = state.remainMs <= 10_000;
    const pulse = urgent
      ? 0.82 + 0.18 * Math.sin(this.pulseMs / 180)
      : 0.92 + 0.08 * Math.sin(this.pulseMs / 420);

    const player = state.side === 'player';
    const stroke = player ? 0xf0c75e : 0xe87aa8;
    const labelColor = player ? '#f0c75e' : '#e87aa8';
    const clockColor = urgent ? (player ? '#fff0c0' : '#ffd0e0') : '#fff8e8';

    this.panel
      .setVisible(true)
      .setStrokeStyle(2.5, stroke, pulse)
      .setFillStyle(player ? 0x1a2818 : 0x281018, 0.92);
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
