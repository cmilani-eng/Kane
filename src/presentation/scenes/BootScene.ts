/**
 * Boot — generate placeholders, brief branded splash, then Menu.
 * Splash is short and tap-to-skip (mobile-safe); never a long block.
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { t } from '../../i18n';
import { registerUnitAnims } from '../animations/unitAnims';
import { hideDomHud } from '../ui/domHud';
import {
  generatePropTextures,
  generateTilesetTexture,
  generateUnitSpriteSheets,
} from '../maps/tilesetAssets';

/** Visible splash window before auto-advance (tap skips sooner). */
const SPLASH_MS = 1400;

export class BootScene extends Phaser.Scene {
  private advanced = false;

  constructor() {
    super('Boot');
  }

  create(): void {
    hideDomHud();
    this.advanced = false;

    generateTilesetTexture(this);
    generateUnitSpriteSheets(this);
    generatePropTextures(this);
    registerUnitAnims(this);

    this.buildSplash();
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off('resize', this.onResize, this),
    );

    this.input.once('pointerup', () => this.advance());
    this.time.delayedCall(SPLASH_MS, () => this.advance());
  }

  private onResize = (): void => {
    if (this.advanced) return;
    this.children.removeAll(true);
    this.buildSplash();
  };

  private buildSplash(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1220, 0x0a1220, 0x1a2a3a, 0x243a28, 1);
    bg.fillRect(0, 0, width, height);

    const orb = this.add
      .circle(width * 0.7, height * 0.28, Math.min(100, width * 0.18), 0x3d7ea6, 0.2)
      .setAlpha(0);
    const orb2 = this.add
      .circle(width * 0.22, height * 0.7, Math.min(70, width * 0.12), 0x4a7a3a, 0.16)
      .setAlpha(0);

    const title = this.add
      .text(width / 2, height * 0.42, BRAND.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: Math.min(72, width * 0.18) + 'px',
        color: '#f5e6c8',
        stroke: '#0a1220',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const tag = this.add
      .text(width / 2, height * 0.54, BRAND.tagline, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: Math.min(16, width * 0.04) + 'px',
        color: '#f0c75e',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const hint = this.add
      .text(width / 2, height * 0.88, t('boot.tap'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#6a7f94',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: [orb, orb2],
      alpha: 1,
      duration: 420,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: title.y + 6,
      duration: 480,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: tag,
      alpha: 1,
      duration: 420,
      delay: 120,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: hint,
      alpha: 0.85,
      duration: 360,
      delay: 400,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: orb,
      scale: 1.12,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private advance(): void {
    if (this.advanced) return;
    this.advanced = true;
    this.scene.start('Menu');
  }
}
