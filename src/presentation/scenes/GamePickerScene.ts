/**
 * GamePickerScene — Phaser scene serving as the single-engine game hub.
 * Renders polished game cards, handles locale switching, and lazily loads
 * game scenes on user selection. Supports URL-based auto-start (?game=kane).
 *
 * Called by: src/main.ts (registers in scene array as first scene)
 * Reads: GAME_REGISTRY from src/games/registry.ts (GameManifest[])
 */
import Phaser from 'phaser';
import { GAME_REGISTRY, type GameManifest } from '../../games/registry';
import { t, subscribeLocale } from '../../i18n';
import { addLocalePicker } from '../ui/localePicker';
import { playSfx } from '../audio/sfx';

const CARD_COLORS: Record<string, { accent: number; edge: number; glow: number }> = {
  kane: { accent: 0xffd23f, edge: 0xa8791a, glow: 0xffd23f },
  'blob-evolution': { accent: 0x9dff6a, edge: 0x4a9a2c, glow: 0x9dff6a },
};
const DEFAULT_CARD_COLORS = { accent: 0x7be0ff, edge: 0x328da8, glow: 0x7be0ff };

const PILL_BG = 0x2a4050;
const PILL_TEXT = 0xfff8e8;
const LIVE_PILL_BG = 0x2a5a7a;
const LIVE_PILL_TEXT = 0x7be0ff;
const EXP_PILL_BG = 0x3d3510;
const EXP_PILL_TEXT = 0xf0c75e;

const CARD_W = 320;
const CARD_H = 420;
const CARD_RADIUS = 32;
const GAP = 40;

export class GamePickerScene extends Phaser.Scene {
  private localeUnsub?: () => void;
  private cardContainer: Phaser.GameObjects.Container = null!;
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super('GamePicker');
  }

  create(): void {
    this.buildBackground();
    this.buildHeader();
    this.buildGameCards();
    this.buildFooter();

    // Check URL for auto-start (e.g. ?game=kane)
    const urlParams = new URLSearchParams(window.location.search);
    const autoGame = urlParams.get('game');
    if (autoGame) {
      const game = GAME_REGISTRY.find((g) => g.id === autoGame);
      if (game) {
        this.time.delayedCall(300, () => this.startGame(game));
      }
    }

    // Re-render on locale change
    this.localeUnsub = subscribeLocale(() => this.refreshLocale());
  }

  shutdown(): void {
    this.localeUnsub?.();
    this.tweens.killAll();
  }

  private buildBackground(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x07111d, 0x07111d, 0x0f1a2e, 0x14283a, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative animated blobs
    for (let i = 0; i < 4; i++) {
      const x = Phaser.Math.Between(width * 0.1, width * 0.9);
      const y = Phaser.Math.Between(height * 0.1, height * 0.9);
      const r = Phaser.Math.Between(100, 200);
      const blob = this.add.circle(x, y, r, 0x1a2a3a, 0.12);
      this.tweens.add({
        targets: blob,
        scale: { from: 1, to: 1.2 },
        duration: Phaser.Math.Between(4000, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Subtle grid texture
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a3a50, 0.15);
    for (let x = 0; x < width; x += 60) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 60) {
      grid.lineBetween(0, y, width, y);
    }
  }

  private buildHeader(): void {
    const { width } = this.scale;
    const y = 50;

    // Locale picker (top-right)
    addLocalePicker({
      scene: this,
      x: width - 110,
      y: 35,
      depth: 100,
    });

    // Title
    this.add
      .text(width / 2, y, t('hub.title'), {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(48px,10vw,80px)',
        color: '#f5e6c8',
        stroke: '#07111d',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(width / 2, y + 85, t('hub.subtitle'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#8aa3b8',
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private buildGameCards(): void {
    const { width, height } = this.scale;
    const games = GAME_REGISTRY;
    const totalWidth = games.length * CARD_W + (games.length - 1) * GAP;
    const startX = (width - totalWidth) / 2 + CARD_W / 2;
    const cardY = height / 2 + 10;

    this.cardContainer = this.add.container(0, 0);

    games.forEach((game, index) => {
      const x = startX + index * (CARD_W + GAP);
      const card = this.createGameCard(game, x, cardY);
      this.cardContainer.add(card);
    });
  }

  private createGameCard(game: GameManifest, x: number, y: number): Phaser.GameObjects.Container {
    const colors = CARD_COLORS[game.id] ?? DEFAULT_CARD_COLORS;
    const card = this.add.container(x, y);

    // Card shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-CARD_W / 2 + 6, -CARD_H / 2 + 6, CARD_W, CARD_H, CARD_RADIUS);
    card.add(shadow);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x0f1a2e, 1);
    bg.lineStyle(3, colors.edge, 0.6);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_RADIUS);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_RADIUS);
    card.add(bg);

    // Inner glow border (starts hidden, appears on hover)
    const glow = this.add.graphics();
    glow.fillStyle(colors.glow, 1);
    glow.fillRoundedRect(-CARD_W / 2 + 2, -CARD_H / 2 + 2, CARD_W - 4, CARD_H - 4, CARD_RADIUS - 2);
    glow.setAlpha(0);
    card.add(glow);

    // Accent line at top
    const accent = this.add.graphics();
    accent.fillStyle(colors.accent, 1);
    accent.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, 5, { tl: CARD_RADIUS, tr: CARD_RADIUS });
    card.add(accent);

    // Pills container (tagline + status)
    const pillsY = -CARD_H / 2 + 28;
    const taglinePill = this.createPill(
      game.tagline,
      -CARD_W / 2 + 20,
      pillsY,
      PILL_BG,
      PILL_TEXT,
    );
    card.add(taglinePill);

    const statusText = game.status === 'live' ? t('hub.live') : t('hub.experimental');
    const statusPill = this.createPill(
      statusText,
      -CARD_W / 2 + 20 + taglinePill.width + 14,
      pillsY,
      game.status === 'live' ? LIVE_PILL_BG : EXP_PILL_BG,
      game.status === 'live' ? LIVE_PILL_TEXT : EXP_PILL_TEXT,
    );
    card.add(statusPill);

    // Title
    const title = this.add
      .text(0, -CARD_H / 2 + 95, game.title, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '34px',
        color: '#f5e6c8',
        stroke: '#07111d',
        strokeThickness: 5,
        align: 'center',
      })
      .setOrigin(0.5);
    card.add(title);

    // Divider line
    const divider = this.add.graphics();
    divider.lineStyle(1, colors.edge, 0.4);
    divider.lineBetween(-CARD_W / 3, -CARD_H / 2 + 150, CARD_W / 3, -CARD_H / 2 + 150);
    card.add(divider);

    // Description
    const descKey = game.id === 'kane' ? 'hub.kane.blurb' : 'hub.blob.blurb';
    const desc = this.add
      .text(0, -CARD_H / 2 + 170, t(descKey), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#b8c9d9',
        wordWrap: { width: CARD_W - 60 },
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);
    card.add(desc);

    // Path tip (game-specific)
    const pathTipKey = game.id === 'kane' ? 'hub.kanePathTip' : 'hub.blobPathTip';
    const pathTip = this.add
      .text(0, -CARD_H / 2 + 260, t(pathTipKey, { path: `/${game.id}/` }), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#f0c75e',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    card.add(pathTip);

    // Play button (larger, better styled)
    const accentHex = '#' + colors.accent.toString(16).padStart(6, '0');
    const playBtn = this.add
      .text(0, CARD_H / 2 - 70, t('hub.play'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#1a1408',
        backgroundColor: accentHex,
        padding: { x: 36, y: 16 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        glow.setAlpha(0.15);
        const brightened = Phaser.Display.Color.IntegerToColor(colors.accent).brighten(25).color;
        playBtn.setStyle({ backgroundColor: '#' + brightened.toString(16).padStart(6, '0') });
        playBtn.setScale(1.05);
      })
      .on('pointerout', () => {
        glow.setAlpha(0);
        playBtn.setStyle({ backgroundColor: accentHex });
        playBtn.setScale(1);
      })
      .on('pointerdown', () => {
        playBtn.setScale(0.95);
      })
      .on('pointerup', () => {
        playBtn.setScale(1.05);
        this.startGame(game);
      });
    card.add(playBtn);

    // Entrance animation
    card.setAlpha(0).setScale(0.9).setY(y + 30);
    const cardIndex = GAME_REGISTRY.indexOf(game);
    this.tweens.add({
      targets: card,
      alpha: 1,
      scale: 1,
      y: y,
      duration: 500,
      delay: cardIndex * 120,
      ease: 'Back.easeOut',
    });

    return card;
  }

  private createPill(
    text: string,
    x: number,
    y: number,
    bgColor: number,
    textColor: number,
  ): Phaser.GameObjects.Container {
    const pill = this.add.container(x, y);
    const txt = this.add
      .text(0, 0, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#' + textColor.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    const paddingX = 14;
    const paddingY = 7;
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(
      -txt.width / 2 - paddingX,
      -txt.height / 2 - paddingY,
      txt.width + paddingX * 2,
      txt.height + paddingY * 2,
      14,
    );
    pill.add([bg, txt]);
    pill.setSize(txt.width + paddingX * 2, txt.height + paddingY * 2);
    return pill;
  }

  private buildFooter(): void {
    const { width, height } = this.scale;
    const y = height - 50;

    // Copyright
    this.add
      .text(width / 2, y, t('hub.year', { n: new Date().getFullYear() }), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#5a6d7a',
      })
      .setOrigin(0.5);

    // Privacy / Terms links
    this.add
      .text(width / 2 - 100, y, t('menu.privacy'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#8aa3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        window.location.href = '/privacy.html';
      });
    this.add
      .text(width / 2 + 100, y, t('menu.terms'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#8aa3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        window.location.href = '/terms.html';
      });
  }

  private async startGame(game: GameManifest): Promise<void> {
    playSfx('ui');

    // Show loading indicator
    this.showLoading(t('hub.loading', { title: game.title }));

    try {
      // Dynamically import the game's scene module
      await game.dynamicImport();

      // Start the game's first scene
      this.scene.start(game.sceneKey);
    } catch (error) {
      console.error(`Failed to load game ${game.id}:`, error);
      this.hideLoading();
      this.showError(t('hub.loadError'));
    }
  }

  private showLoading(message: string): void {
    const { width, height } = this.scale;
    this.loadingText = this.add
      .text(width / 2, height / 2 - 20, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#f0c75e',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000);

    // Pulse animation
    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 1, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private hideLoading(): void {
    if (this.loadingText) {
      this.tweens.killTweensOf(this.loadingText);
      this.loadingText.destroy();
      this.loadingText = undefined;
    }
  }

  private showError(message: string): void {
    const { width, height } = this.scale;
    const errorText = this.add
      .text(width / 2, height / 2 + 60, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#ff6b6b',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.time.delayedCall(3000, () => errorText.destroy());
  }

  private refreshLocale(): void {
    // Clean up old subscription before recreating
    this.localeUnsub?.();
    this.children.removeAll(true);
    this.create();
  }
}
