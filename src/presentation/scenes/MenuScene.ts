import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { hideDomHud } from '../ui/domHud';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    hideDomHud();
    this.buildLayout(true);
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off('resize', this.onResize, this),
    );
  }

  /** Everything is positioned from the canvas size, so rebuild when it changes. */
  private onResize(): void {
    this.tweens.killAll();
    this.children.removeAll(true);
    this.buildLayout(false);
  }

  private buildLayout(intro: boolean): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f1a2e, 0x0f1a2e, 0x1a3a4a, 0x243a28, 1);
    bg.fillRect(0, 0, width, height);

    const orb = this.add.circle(width * 0.72, height * 0.22, 90, 0x3d7ea6, 0.18);
    this.tweens.add({
      targets: orb,
      scale: 1.15,
      alpha: 0.28,
      duration: 3200,
      yoyo: true,
      repeat: -1,
    });
    const orb2 = this.add.circle(width * 0.18, height * 0.72, 60, 0x4a7a3a, 0.14);
    this.tweens.add({
      targets: orb2,
      y: orb2.y - 20,
      duration: 4000,
      yoyo: true,
      repeat: -1,
    });
    const orb3 = this.add.circle(width * 0.5, height * 0.18, 50, 0x7a4aa8, 0.16);
    this.tweens.add({
      targets: orb3,
      scale: 1.2,
      alpha: 0.3,
      duration: 2800,
      yoyo: true,
      repeat: -1,
    });

    const title = this.add
      .text(width / 2, height * 0.12, BRAND.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: Math.min(72, width * 0.16) + 'px',
        color: '#f5e6c8',
        stroke: '#1a2a4a',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    if (intro) {
      title.setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, y: title.y + 6, duration: 700 });
    } else {
      title.y += 6;
    }

    this.add
      .text(width / 2, height * 0.22, BRAND.tagline, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: Math.min(18, width * 0.045) + 'px',
        color: '#f0c75e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.28, 'Pick your species for a local skirmish', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5);

    const gap = Math.min(200, width * 0.28);
    const cardY = height * 0.52;
    const cards: {
      id: SpeciesId;
      fill: number;
      stroke: number;
    }[] = [
      { id: 'brutes', fill: 0x4a7a3a, stroke: 0xd4782e },
      { id: 'nobles', fill: 0x3d7ea6, stroke: 0xf0c75e },
      { id: 'weirdos', fill: 0x7a4aa8, stroke: 0x6ecfbf },
    ];
    cards.forEach((c, i) => {
      const s = SPECIES[c.id];
      this.makeSpeciesCard(
        width / 2 + (i - 1) * gap,
        cardY,
        s.name,
        s.motto,
        s.uniqueMechanic,
        c.fill,
        c.stroke,
        () => this.startMatch(c.id),
      );
    });

    this.add
      .text(
        width / 2,
        height * 0.82,
        `Ages ${flags.ageGateMinYears}+  ·  Ads ${flags.adsEnabled ? 'on' : 'off'}  ·  Local-first`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#7a8fa3',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.9,
        'FORMATIONS (F) · MUTATION (M) · Heroes (H, Q/W/E) · opponent rotates species',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#6a7f94',
        },
      )
      .setOrigin(0.5);
  }

  private startMatch(species: SpeciesId): void {
    this.scene.start('Battlefield', { species });
  }

  private makeSpeciesCard(
    x: number,
    y: number,
    name: string,
    motto: string,
    mechanic: string,
    fill: number,
    stroke: number,
    onClick: () => void,
  ): void {
    const w = Math.min(190, this.scale.width * 0.28);
    const h = 150;
    const bg = this.add
      .rectangle(x, y, w, h, fill, 1)
      .setStrokeStyle(3, stroke)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y - 40, name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '18px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y - 8, motto, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        color: '#e8f0f8',
        align: 'center',
        wordWrap: { width: w - 16 },
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 36, mechanic, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#f0c75e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 58, 'Play', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.92));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', onClick);
  }
}
