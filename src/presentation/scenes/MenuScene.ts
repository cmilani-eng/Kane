import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { recordGameStarted, wantsAdminPanel } from '../../database/localStats';
import {
  loadMatchPrefs,
  rememberMatchPrefs,
} from '../../database/matchPrefs';
import { canEnterGame, loadAgeGate } from '../../firebase/ageGate';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import {
  AI_DIFFICULTIES,
  AI_DIFFICULTY_ORDER,
  type AiDifficultyId,
} from '../../gameplay/battlefield/aiDifficulty';
import {
  hideMenuBannerStub,
  showMenuBannerStub,
} from '../../ads/adsSdkStub';
import { ensureAmbientBgm } from '../audio/bgm';
import { playSfx } from '../audio/sfx';
import { hideDomHud } from '../ui/domHud';
import { showCosmeticsPanel } from '../ui/cosmeticsPanel';
import { showLobbyPanel } from '../ui/lobbyPanel';
import { softLaunchStatusStrip } from '../ui/softLaunchStatus';
import { showStatsPanel } from '../ui/statsPanel';
import { createVolumeSlider } from '../ui/volumeSlider';
import { drawSpeciesPreview } from '../units/unitSilhouette';

export class MenuScene extends Phaser.Scene {
  private statsOpen = false;
  private lobbyOpen = false;
  private cosmeticsOpen = false;
  private difficulty: AiDifficultyId = 'normal';
  /** Last played / remembered species — highlighted on the menu. */
  private lastSpecies: SpeciesId = 'nobles';
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
    const prefs = loadMatchPrefs();
    this.difficulty = prefs.difficulty;
    this.lastSpecies = prefs.species;
    this.statsOpen = false;
    this.lobbyOpen = false;
    this.cosmeticsOpen = false;
    this.previewSlots = [];
    this.buildLayout(true);
    showMenuBannerStub();
    // Ambient BGM needs a user gesture for autoplay policy.
    this.input.once('pointerdown', () => ensureAmbientBgm());
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onResize, this);
      hideMenuBannerStub();
    });
    if (wantsAdminPanel()) {
      this.openStats();
    }
  }

  /** Everything is positioned from the canvas size, so rebuild when it changes. */
  private onResize(): void {
    if (this.statsOpen || this.lobbyOpen || this.cosmeticsOpen) return;
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
    if (this.statsOpen || this.lobbyOpen || this.cosmeticsOpen) return;
    this.statsOpen = true;
    playSfx('ui');
    showStatsPanel(this, () => {
      this.statsOpen = false;
    });
  }

  private openLobby(): void {
    if (this.statsOpen || this.lobbyOpen || this.cosmeticsOpen) return;
    this.lobbyOpen = true;
    playSfx('ui');
    showLobbyPanel(this, () => {
      this.lobbyOpen = false;
    });
  }

  private openCosmetics(): void {
    if (this.statsOpen || this.lobbyOpen || this.cosmeticsOpen) return;
    this.cosmeticsOpen = true;
    playSfx('ui');
    showCosmeticsPanel(this, () => {
      this.cosmeticsOpen = false;
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
          c.id === this.lastSpecies,
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
          undefined,
          undefined,
          c.id === this.lastSpecies,
        );
      });
    }

    createVolumeSlider({
      scene: this,
      x: width / 2,
      y: height * 0.76,
      width: Math.min(280, width * 0.7),
      depth: 30,
    });

    this.add
      .text(width / 2, height * 0.81, softLaunchStatusStrip(), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#7a8fa3',
      })
      .setOrigin(0.5);

    const gap = Math.min(120, width * 0.3);
    this.add
      .text(width / 2 - gap, height * 0.86, 'Friends', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff8e8',
        backgroundColor: '#2a3a50',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openLobby());
    this.add
      .text(width / 2, height * 0.86, 'Cosmetics', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff8e8',
        backgroundColor: '#3a4a2a',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openCosmetics());
    this.add
      .text(width / 2 + gap, height * 0.86, 'Stats', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff8e8',
        backgroundColor: '#3a4555',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openStats());

    this.add
      .text(
        width / 2,
        height * 0.92,
        'RAGE (R) · FORMATIONS (F) · MUTATION (M) · Heroes (H, Q/W/E)',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#6a7f94',
        },
      )
      .setOrigin(0.5);

    const legalY = height * 0.97;
    const privacy = this.add
      .text(width / 2 - 48, legalY, 'Privacy', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#7ec8ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    privacy.on('pointerup', () => {
      playSfx('ui');
      if (typeof window !== 'undefined') window.open('/privacy.html', '_blank');
    });
    const terms = this.add
      .text(width / 2 + 48, legalY, 'Terms', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#7ec8ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    terms.on('pointerup', () => {
      playSfx('ui');
      if (typeof window !== 'undefined') window.open('/terms.html', '_blank');
    });
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
        rememberMatchPrefs(this.lastSpecies, this.difficulty);
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
    this.lastSpecies = species;
    rememberMatchPrefs(species, this.difficulty);
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
    remembered = false,
  ): void {
    const w = cardW ?? Math.min(190, this.scale.width * 0.28);
    const h = cardH ?? 150;
    const bg = this.add
      .rectangle(x, y, w, h, fill, 1)
      .setStrokeStyle(remembered ? 4 : 3, remembered ? 0xf0c75e : stroke)
      .setInteractive({ useHandCursor: true });
    this.previewSlots.push({ id: speciesId, x, y: y - 28 });
    this.add
      .text(x, y - 52, name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '16px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);
    if (remembered && h > 120) {
      this.add
        .text(x, y - 68, 'Last played', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          color: '#f0c75e',
        })
        .setOrigin(0.5);
    }
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
      .text(x, y + 58, remembered ? 'Play · last' : 'Play', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: remembered ? '#f0c75e' : '#fff8e8',
      })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.92));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', onClick);
  }
}
