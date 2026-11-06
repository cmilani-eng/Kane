/**
 * Mid-screen victory-hold countdown when a side owns enough CORE fragments.
 */
import Phaser from 'phaser';
import {
  coreHoldBannerState,
  type CoreHoldBannerState,
} from '../../gameplay/battlefield/battlefieldCoreFragments';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';

function formatRemain(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export class CoreVictoryBanner {
  private readonly scene: Phaser.Scene;
  private readonly world: BattlefieldWorld;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly clock: Phaser.GameObjects.Text;
  private pulseMs = 0;

  constructor(scene: Phaser.Scene, world: BattlefieldWorld) {
    this.scene = scene;
    this.world = world;
    const w = Math.min(420, scene.scale.width - 32);

    this.panel = scene.add
      .rectangle(0, 0, w, 56, 0x122033, 0.92)
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
        fontSize: '22px',
        color: '#fff8e8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(119)
      .setVisible(false);

    this.layout();
  }

  gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.panel, this.label, this.clock];
  }

  layout(): void {
    const w = this.scene.scale.width;
    const panelW = Math.min(420, w - 32);
    const x = w / 2;
    // Sit under the match timer, above combat focus.
    const y = 56;
    this.panel.setSize(panelW, 56).setPosition(x, y);
    this.label.setPosition(x, y - 4);
    this.clock.setPosition(x, y + 2);
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
      this.pulseMs = 0;
      return;
    }

    this.pulseMs += dtMs;
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
          ? `VICTORY HOLD  ·  CORE ${state.owned}/${state.needed}`
          : `ENEMY CORE HOLD  ·  ${state.owned}/${state.needed}`,
      );
    this.clock
      .setVisible(true)
      .setColor(clockColor)
      .setAlpha(pulse)
      .setText(formatRemain(state.remainMs));
  }
}
