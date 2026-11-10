/**
 * GamePickerScene — Phaser scene replacing the DOM-based game hub.
 * Renders game cards using Phaser GameObjects, handles locale switching,
 * and lazily loads game scenes on user selection.
 *
 * Called by: src/main.ts (registers in scene array)
 * Replaces: games/hub/hub.ts (DOM-based)
 * Reads: GAME_REGISTRY from src/games/registry.ts (GameManifest[])
 */
import Phaser from 'phaser';
import { GAME_REGISTRY, type GameManifest } from '../../games/registry';
import { t, subscribeLocale } from '../../i18n';
import { addLocalePicker } from '../ui/localePicker';
import { playSfx } from '../audio/sfx';

const CARD_COLORS: Record<string, { accent: number; edge: number }> = {
  kane: { accent: 0xffd23f, edge: 0xa8791a },
  'blob-evolution': { accent: 0x9dff6a, edge: 0x4a9a2c },
};
const DEFAULT_CARD_COLORS = { accent: 0x7be0ff, edge: 0x328da8 };

const PILL_BG = 0x2a4050;
const PILL_TEXT = 0xfff8e8;
const LIVE_PILL_BG = 0x2a5a7a;
const LIVE_PILL_TEXT = 0x7be0ff;
const EXP_PILL_BG = 0x3d3510;
const EXP_PILL_TEXT = 0xf0c75e;

const CARD_W = 280;
const CARD_H = 340;
const CARD_RADIUS = 24;
const GAP = 28;

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

    // Decorative blobs (matching hub CSS)
    for (let i = 0; i < 3; i++) {
      const x = Phaser.Math.Between(width * 0.1, width * 0.9);
      const y = Phaser.Math.Between(height * 0.1, height * 0.9);
      const r = Phaser.Math.Between(80, 160);
      const blob = this.add.circle(x, y, r, 0x1a2a3a, 0.15);
      this.tweens.add({
        targets: blob,
        scale: { from: 1, to: 1.15 },
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private buildHeader(): void {
    const { width } = this.scale;
    const y = 60;

    // Locale picker (top-right)
    addLocalePicker({
      scene: this,
      x: width - 100,
      y: 40,
      depth: 100,
    });

    // Title
    this.add
      .text(width / 2, y, t('hub.title'), {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(40px,9vw,64px)',
        color: '#f5e6c8',
        stroke: '#07111d',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(width / 2, y + 70, t('hub.subtitle'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
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
    const cardY = height / 2 + 20;

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

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x0f1a2e, 1);
    bg.lineStyle(2, colors.edge, 0.5);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_RADIUS);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_RADIUS);
    card.add(bg);

    // Accent line at top
    const accent = this.add.graphics();
    accent.fillStyle(colors.accent, 1);
    accent.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, 4, { tl: CARD_RADIUS, tr: CARD_RADIUS });
    card.add(accent);

    // Pills container (tagline + status)
    const pillsY = -CARD_H / 2 + 24;
    const taglinePill = this.createPill(
      game.tagline,
      -CARD_W / 2 + 16,
      pillsY,
      PILL_BG,
      PILL_TEXT,
    );
    card.add(taglinePill);

    const statusText = game.status === 'live' ? t('hub.live') : t('hub.experimental');
    const statusPill = this.createPill(
      statusText,
      -CARD_W / 2 + 16 + taglinePill.width + 12,
      pillsY,
      game.status === 'live' ? LIVE_PILL_BG : EXP_PILL_BG,
      game.status === 'live' ? LIVE_PILL_TEXT : EXP_PILL_TEXT,
    );
    card.add(statusPill);

    // Title
    const title = this.add
      .text(0, -CARD_H / 2 + 70, game.title, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '28px',
        color: '#f5e6c8',
        stroke: '#07111d',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);
    card.add(title);

    // Description
    const descKey = game.id === 'kane' ? 'hub.kane.blurb' : 'hub.blob.blurb';
    const desc = this.add
      .text(0, -CARD_H / 2 + 130, t(descKey), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
        wordWrap: { width: CARD_W - 40 },
        align: 'center',
      })
      .setOrigin(0.5);
    card.add(desc);

    // Path tip (game-specific)
    const pathTipKey = game.id === 'kane' ? 'hub.kanePathTip' : 'hub.blobPathTip';
    const pathTip = this.add
      .text(0, -CARD_H / 2 + 220, t(pathTipKey, { path: `/${game.id}/` }), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#f0c75e',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    card.add(pathTip);

    // Play button
    const playBtn = this.add
      .text(0, CARD_H / 2 - 50, t('hub.play'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#1a1408',
        backgroundColor: '#' + colors.accent.toString(16).padStart(6, '0'),
        padding: { x: 28, y: 13 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        const brightened = Phaser.Display.Color.IntegerToColor(colors.accent).brighten(20).color;
        playBtn.setStyle({ backgroundColor: '#' + brightened.toString(16).padStart(6, '0') });
      })
      .on('pointerout', () => {
        playBtn.setStyle({ backgroundColor: '#' + colors.accent.toString(16).padStart(6, '0') });
      })
      .on('pointerdown', () => {
        playBtn.setScale(0.98);
      })
      .on('pointerup', () => {
        playBtn.setScale(1);
        this.startGame(game);
      });
    card.add(playBtn);

    // Entrance animation
    card.setAlpha(0).setScale(0.95);
    const cardIndex = GAME_REGISTRY.indexOf(game);
    this.tweens.add({
      targets: card,
      alpha: 1,
      scale: 1,
      duration: 400,
      delay: cardIndex * 80,
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
        fontSize: '11px',
        color: '#' + textColor.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    const paddingX = 12;
    const paddingY = 6;
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(
      -txt.width / 2 - paddingX,
      -txt.height / 2 - paddingY,
      txt.width + paddingX * 2,
      txt.height + paddingY * 2,
      12,
    );
    pill.add([bg, txt]);
    pill.setSize(txt.width + paddingX * 2, txt.height + paddingY * 2);
    return pill;
  }

  private buildFooter(): void {
    const { width, height } = this.scale;
    const y = height - 40;

    this.add
      .text(width / 2, y, t('hub.year', { n: new Date().getFullYear() }), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#5a6d7a',
      })
      .setOrigin(0.5);

    // Privacy / Terms links as interactive text
    this.add
      .text(width / 2 - 80, y, t('menu.privacy'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#8aa3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        window.location.href = '/privacy.html';
      });
    this.add
      .text(width / 2 + 80, y, t('menu.terms'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
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
      .text(width / 2, height / 2, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
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
        fontSize: '16px',
        color: '#ff6b6b',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.time.delayedCall(3000, () => errorText.destroy());
  }

  private refreshLocale(): void {
    // Rebuild UI with new locale
    this.children.removeAll(true);
    this.create();
  }
}