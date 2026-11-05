import Phaser from 'phaser';
import { FACTION } from '../config/balance';
import { flags } from '../config/flags';
import { hideDomHud } from '../ui/domHud';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    hideDomHud();
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f1a2e, 0x0f1a2e, 0x1a3a4a, 0x243a28, 1);
    bg.fillRect(0, 0, width, height);

    const orb = this.add.circle(width * 0.7, height * 0.25, 90, 0x3d7ea6, 0.15);
    this.tweens.add({
      targets: orb,
      scale: 1.15,
      alpha: 0.25,
      duration: 3200,
      yoyo: true,
      repeat: -1,
    });
    const orb2 = this.add.circle(width * 0.2, height * 0.7, 60, 0xf0c75e, 0.1);
    this.tweens.add({
      targets: orb2,
      y: orb2.y - 20,
      duration: 4000,
      yoyo: true,
      repeat: -1,
    });

    const title = this.add
      .text(width / 2, height * 0.22, 'KANE', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: Math.min(72, width * 0.18) + 'px',
        color: '#f5e6c8',
        stroke: '#1a2a4a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    title.setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: title.y + 8, duration: 700 });

    this.add
      .text(width / 2, height * 0.34, 'Light the Wardstones. Defend your Keep.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#b8c9d9',
        align: 'center',
        wordWrap: { width: width - 48 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.44, `${FACTION.name}\n${FACTION.blurb}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#d7e6f2',
        align: 'center',
        wordWrap: { width: Math.min(420, width - 40) },
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    this.makeButton(width / 2, height * 0.62, 'Play vs AI', () => {
      this.scene.start('Game');
    });

    this.add
      .text(
        width / 2,
        height * 0.78,
        `Ages ${flags.ageGateMinYears}+  ·  Ads ${flags.adsEnabled ? 'on' : 'off'}  ·  Local-first`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#7a8fa3',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.88, 'Touch-first · Tap select · Drag box · Pinch zoom', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#6a7f94',
      })
      .setOrigin(0.5);
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): void {
    const w = Math.min(280, this.scale.width - 48);
    const h = 56;
    // Flat interactive rect (not nested in a Container) for reliable Phaser 4 hits.
    const bg = this.add
      .rectangle(x, y, w, h, 0x3d7ea6, 1)
      .setStrokeStyle(3, 0xf0c75e)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#fff8e8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1);
    bg.setDepth(0);
    bg.on('pointerover', () => bg.setFillStyle(0x4b93bd));
    bg.on('pointerout', () => bg.setFillStyle(0x3d7ea6));
    bg.on('pointerdown', () => {
      bg.setFillStyle(0x2f6280);
      onClick();
    });
  }
}
