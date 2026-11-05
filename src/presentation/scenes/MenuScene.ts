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

    const title = this.add
      .text(width / 2, height * 0.14, BRAND.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: Math.min(80, width * 0.18) + 'px',
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
      .text(width / 2, height * 0.26, BRAND.tagline, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: Math.min(18, width * 0.045) + 'px',
        color: '#f0c75e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.32, 'Pick your species for a local skirmish', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5);

    const brutes = SPECIES.brutes;
    const nobles = SPECIES.nobles;
    this.makeSpeciesCard(
      width / 2 - Math.min(170, width * 0.22),
      height * 0.52,
      brutes.name,
      brutes.motto,
      brutes.uniqueMechanic,
      0x4a7a3a,
      0xd4782e,
      () => this.startMatch('brutes'),
    );
    this.makeSpeciesCard(
      width / 2 + Math.min(170, width * 0.22),
      height * 0.52,
      nobles.name,
      nobles.motto,
      nobles.uniqueMechanic,
      0x3d7ea6,
      0xf0c75e,
      () => this.startMatch('nobles'),
    );

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
        'Nobles: FORMATIONS (F) · Brutes: swarm  ·  opponent is the other species',
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
    const w = Math.min(280, this.scale.width * 0.4);
    const h = 150;
    const bg = this.add
      .rectangle(x, y, w, h, fill, 1)
      .setStrokeStyle(3, stroke)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y - 40, name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '22px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y - 8, motto, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#e8f0f8',
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 36, mechanic, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
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
