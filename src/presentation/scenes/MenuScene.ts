import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import { recordGameStarted, wantsAdminPanel } from '../../database/localStats';
import { canEnterGame, loadAgeGate } from '../../firebase/ageGate';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import {
  AI_DIFFICULTIES,
  AI_DIFFICULTY_ORDER,
  type AiDifficultyId,
} from '../../gameplay/battlefield/aiDifficulty';
import { playSfx } from '../audio/sfx';
import { hideDomHud } from '../ui/domHud';
import { showLobbyPanel } from '../ui/lobbyPanel';
import { showStatsPanel } from '../ui/statsPanel';
import { drawSpeciesPreview } from '../units/unitSilhouette';

export class MenuScene extends Phaser.Scene {
  private statsOpen = false;
  private lobbyOpen = false;
  private difficulty: AiDifficultyId = 'normal';
  private previewGfx: Phaser.GameObjects.Graphics | null = null;
  private previewSlots: { id: SpeciesId; x: number; y: number }[] = [];

  constructor() {
    super('Menu');
  }

  create(): void {
    hideDomHud();
    if (!canEnterGame(loadAgeGate())) {
      this.scene.start('AgeGate');
      return;
    }
    this.statsOpen = false;
    this.lobbyOpen = false;
    this.previewSlots = [];
    this.buildLayout(true);
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off('resize', this.onResize, this),
    );
    if (wantsAdminPanel()) {
      this.openStats();
    }
  }

  /** Everything is positioned from the canvas size, so rebuild when it changes. */
  private onResize(): void {
    if (this.statsOpen || this.lobbyOpen) return;
    this.tweens.killAll();
    this.children.removeAll(true);
    this.previewGfx = null;
    this.previewSlots = [];
    this.buildLayout(false);
  }

  update(_t: number, _dt: number): void {
    if (this.statsOpen || !this.previewGfx || this.previewSlots.length === 0) {
      return;
    }
    const g = this.previewGfx;
    g.clear();
    const now = this.time.now;
    for (const s of this.previewSlots) {
      drawSpeciesPreview(g, s.id, s.x, s.y, now, 1.05);
    }
  }

  private openStats(): void {
    if (this.statsOpen || this.lobbyOpen) return;
    this.statsOpen = true;
    playSfx('ui');
    showStatsPanel(this, () => {
      this.statsOpen = false;
    });
  }

  private openLobby(): void {
    if (this.statsOpen || this.lobbyOpen) return;
    this.lobbyOpen = true;
    playSfx('ui');
    showLobbyPanel(this, () => {
      this.lobbyOpen = false;
    });
  }

  private buildLayout(intro: boolean): void {
    const { width, height } = this.scale;
    this.previewSlots = [];
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f1a2e, 0x0f1a2e, 0x1a3a4a, 0x243a28, 1);
    bg.fillRect(0, 0, width, height);
    this.previewGfx = this.add.graphics().setDepth(20);

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
      .text(width / 2, height * 0.26, 'Difficulty', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5);

    this.drawDifficultyRow(width, height * 0.31);

    this.add
      .text(width / 2, height * 0.38, 'Pick your species for a local skirmish', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5);

    const narrow = width < 700;
    const cards: {
      id: SpeciesId;
      fill: number;
      stroke: number;
    }[] = [
      { id: 'brutes', fill: 0x4a7a3a, stroke: 0xd4782e },
      { id: 'nobles', fill: 0x3d7ea6, stroke: 0xf0c75e },
      { id: 'weirdos', fill: 0x7a4aa8, stroke: 0x6ecfbf },
    ];
    if (narrow) {
      const startY = height * 0.44;
      cards.forEach((c, i) => {
        const s = SPECIES[c.id];
        this.makeSpeciesCard(
          c.id,
          width / 2,
          startY + i * 108,
          s.name,
          s.motto,
          s.uniqueMechanic,
          c.fill,
          c.stroke,
          () => this.startMatch(c.id),
          Math.min(300, width * 0.88),
          92,
        );
      });
    } else {
      const gap = Math.min(200, width * 0.28);
      const cardY = height * 0.56;
      cards.forEach((c, i) => {
        const s = SPECIES[c.id];
        this.makeSpeciesCard(
          c.id,
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
    }

    this.add
      .text(
        width / 2,
        height * 0.8,
        `Ages ${flags.ageGateMinYears}+ confirmed  ·  Ads ${flags.adsEnabled ? 'on' : 'off'}  ·  Local-first`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#7a8fa3',
        },
      )
      .setOrigin(0.5);

    const gap = Math.min(150, width * 0.36);
    this.add
      .text(width / 2 - gap * 0.5, height * 0.86, 'Friends lobby', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#2a3a50',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openLobby());
    this.add
      .text(width / 2 + gap * 0.5, height * 0.86, 'Stats  ·  #/admin', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#3a4555',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openStats());

    this.add
      .text(
        width / 2,
        height * 0.94,
        'RAGE (R) · FORMATIONS (F) · MUTATION (M) · Heroes (H, Q/W/E)',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#6a7f94',
        },
      )
      .setOrigin(0.5);
  }

  private drawDifficultyRow(width: number, y: number): void {
    const gap = Math.min(118, width * 0.28);
    AI_DIFFICULTY_ORDER.forEach((id, i) => {
      const d = AI_DIFFICULTIES[id];
      const selected = this.difficulty === id;
      const x = width / 2 + (i - 1) * gap;
      const bg = this.add
        .rectangle(x, y, Math.min(108, gap - 8), 44, selected ? 0x2a3a28 : 0x1a2433, 0.95)
        .setStrokeStyle(2, selected ? 0xf0c75e : 0x3a4555)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(x, y - 8, d.label, {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '15px',
          color: selected ? '#f0c75e' : '#fff8e8',
        })
        .setOrigin(0.5);
      this.add
        .text(x, y + 12, d.blurb, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          color: '#9eb4c8',
          align: 'center',
          wordWrap: { width: Math.min(100, gap - 12) },
        })
        .setOrigin(0.5);
      bg.on('pointerup', () => {
        if (this.difficulty === id) return;
        this.difficulty = id;
        playSfx('ui');
        this.tweens.killAll();
        this.children.removeAll(true);
        this.previewGfx = null;
        this.previewSlots = [];
        this.buildLayout(false);
      });
    });
  }

  private startMatch(species: SpeciesId): void {
    recordGameStarted(species);
    playSfx('ui');
    this.scene.start('Battlefield', {
      species,
      difficulty: this.difficulty,
    });
  }

  private makeSpeciesCard(
    speciesId: SpeciesId,
    x: number,
    y: number,
    name: string,
    motto: string,
    mechanic: string,
    fill: number,
    stroke: number,
    onClick: () => void,
    cardW?: number,
    cardH?: number,
  ): void {
    const w = cardW ?? Math.min(190, this.scale.width * 0.28);
    const h = cardH ?? 150;
    const bg = this.add
      .rectangle(x, y, w, h, fill, 1)
      .setStrokeStyle(3, stroke)
      .setInteractive({ useHandCursor: true });
    this.previewSlots.push({ id: speciesId, x, y: y - 28 });
    this.add
      .text(x, y - 52, name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '16px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 8, motto, {
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
