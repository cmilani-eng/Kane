/**
 * Kane Menu Scene — main menu for Kane game.
 * Moved from src/presentation/scenes/MenuScene.ts with kane_ asset prefixes.
 *
 * Called by: src/games/kane/index.ts (exports for registry)
 * Replaces: src/presentation/scenes/MenuScene.ts (for Kane-specific menu)
 * Reads: Same data as original MenuScene, uses kane_ prefixed assets
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import {
  recordGameStarted,
  wantsAdminPanel,
  wantsStatsPanel,
} from '../../database/localStats';
import { isCoachSeen, setCoachSeen } from '../../database/coachPrefs';
import {
  loadMatchPrefs,
  rememberMatchPrefs,
} from '../../database/matchPrefs';
import {
  getCurrentAuthUser,
  isAnonymousGuest,
  isCloudAccount,
  subscribeAuth,
} from '../../firebase/auth';
import { maybeRecordCloudGameStarted } from '../../firebase/cloudProgression';
import {
  SKIRMISH_MAP_ORDER,
  type SkirmishMapId,
} from '../../data/skirmishMaps';
import type { SpeciesId } from '../../data/speciesStub';
import {
  difficultyCopy,
  mapCopy,
  speciesCopy,
  subscribeLocale,
  t,
} from '../../i18n';
import {
  AI_DIFFICULTY_ORDER,
  type AiDifficultyId,
} from '../../gameplay/battlefield/aiDifficulty';
import {
  hideMenuBannerStub,
  showMenuBannerStub,
} from '../../ads/adsSdkStub';
import { ensureAmbientBgm } from '../../presentation/audio/bgm';
import { playSfx } from '../../presentation/audio/sfx';
import { hideDomHud } from '../../presentation/ui/domHud';
import { showAuthPanel, hideAuthPanel } from '../../presentation/ui/authPanel';
import { showCosmeticsPanel } from '../../presentation/ui/cosmeticsPanel';
import { accountChipName, showDashboardPanel } from '../../presentation/ui/dashboardPanel';
import { showLobbyPanel } from '../../presentation/ui/lobbyPanel';
import { hideMenuGamesLink, showMenuGamesLink } from '../../presentation/ui/menuGamesLink';
import { softLaunchStatusStrip } from '../../presentation/ui/softLaunchStatus';
import { showStatsPanel } from '../../presentation/ui/statsPanel';
import { addLocalePicker } from '../../presentation/ui/localePicker';
import { createVolumeSlider } from '../../presentation/ui/volumeSlider';
import { drawSpeciesPreview } from '../../presentation/units/unitSilhouette';

export class KaneMenuScene extends Phaser.Scene {
  private statsOpen = false;
  private lobbyOpen = false;
  private cosmeticsOpen = false;
  private accountOpen = false;
  private authUnsub: (() => void) | null = null;
  private accountLabel: Phaser.GameObjects.Text | null = null;
  private difficulty: AiDifficultyId = 'normal';
  private mapId: SkirmishMapId = 'crossing';
  private lastSpecies: SpeciesId = 'nobles';
  private previewGfx: Phaser.GameObjects.Graphics | null = null;
  private previewSlots: { id: SpeciesId; x: number; y: number; scale: number }[] = [];
  private localeUnsub: (() => void) | null = null;
  private menuZoom = 1;

  constructor() {
    super('KaneMenu');
  }

  create(): void {
    hideDomHud();
    showMenuGamesLink();
    const prefs = loadMatchPrefs();
    this.difficulty = prefs.difficulty;
    this.mapId = prefs.mapId;
    this.lastSpecies = prefs.species;
    this.statsOpen = false;
    this.lobbyOpen = false;
    this.cosmeticsOpen = false;
    this.accountOpen = false;
    this.previewSlots = [];
    this.buildLayout(true);
    showMenuBannerStub();
    this.authUnsub?.();
    this.authUnsub = subscribeAuth(() => this.refreshAccountChip());
    this.localeUnsub?.();
    this.localeUnsub = subscribeLocale(() => this.rebuildForLocale());
    this.input.once('pointerdown', () => ensureAmbientBgm());
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onResize, this);
      this.authUnsub?.();
      this.authUnsub = null;
      this.localeUnsub?.();
      this.localeUnsub = null;
      hideMenuGamesLink();
      hideAuthPanel();
      hideMenuBannerStub();
    });
    if (wantsStatsPanel()) {
      this.openStats(wantsAdminPanel());
    }
  }

  private rebuildForLocale(): void {
    if (this.anyOverlayOpen()) return;
    this.time.delayedCall(0, () => {
      if (this.anyOverlayOpen()) return;
      this.tweens.killAll();
      this.children.removeAll(true);
      this.previewGfx = null;
      this.previewSlots = [];
      this.accountLabel = null;
      this.buildLayout(false);
    });
  }

  private onResize(): void {
    if (
      this.statsOpen ||
      this.lobbyOpen ||
      this.cosmeticsOpen ||
      this.accountOpen
    ) {
      return;
    }
    this.tweens.killAll();
    this.children.removeAll(true);
    this.previewGfx = null;
    this.previewSlots = [];
    this.accountLabel = null;
    this.buildLayout(false);
  }

  update(_t: number, _dt: number): void {
    if (
      this.statsOpen ||
      this.accountOpen ||
      !this.previewGfx ||
      this.previewSlots.length === 0
    ) {
      return;
    }
    const g = this.previewGfx;
    g.clear();
    const now = this.time.now;
    for (const s of this.previewSlots) {
      drawSpeciesPreview(g, s.id, s.x, s.y, now, s.scale);
    }
  }

  private anyOverlayOpen(): boolean {
    return (
      this.statsOpen ||
      this.lobbyOpen ||
      this.cosmeticsOpen ||
      this.accountOpen
    );
  }

  private openStats(adminTools = false): void {
    if (this.anyOverlayOpen()) return;
    this.statsOpen = true;
    playSfx('ui');
    this.resetMenuCamera();
    showStatsPanel(
      this,
      () => {
        this.statsOpen = false;
        this.fitMenuCamera();
      },
      { adminTools },
    );
  }

  private openLobby(): void {
    if (this.anyOverlayOpen()) return;
    this.lobbyOpen = true;
    playSfx('ui');
    this.resetMenuCamera();
    showLobbyPanel(this, () => {
      this.lobbyOpen = false;
      this.fitMenuCamera();
    });
  }

  private openCosmetics(): void {
    if (this.anyOverlayOpen()) return;
    this.cosmeticsOpen = true;
    playSfx('ui');
    this.resetMenuCamera();
    showCosmeticsPanel(this, () => {
      this.cosmeticsOpen = false;
      this.fitMenuCamera();
    });
  }

  private openAccount(): void {
    if (this.anyOverlayOpen()) return;
    this.accountOpen = true;
    playSfx('ui');
    this.resetMenuCamera();
    showDashboardPanel(this, () => {
      this.accountOpen = false;
      this.fitMenuCamera();
      this.refreshAccountChip();
    });
  }

  private refreshAccountChip(): void {
    if (!this.accountLabel) return;
    const u = getCurrentAuthUser();
    if (isCloudAccount(u) && u) {
      this.accountLabel.setText(
        accountChipName(u.displayName, isAnonymousGuest(u)),
      );
    } else {
      this.accountLabel.setText(t('menu.account'));
    }
  }

  private paintGlow(
    bg: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
    radius: number,
  ): void {
    for (let i = 8; i >= 1; i -= 1) {
      bg.fillStyle(color, 0.018);
      bg.fillCircle(x, y, radius * (0.35 + i * 0.12));
    }
  }

  private buildLayout(intro: boolean): void {
    const { width, height } = this.scale;
    this.menuZoom = 1;
    this.resetMenuCamera();
    if (height < 500) {
      this.buildShortLayout(intro, width, height);
      return;
    }
    this.previewSlots = [];
    const bg = this.add.graphics();
    bg.fillStyle(0x07111d, 1);
    bg.fillRect(0, 0, width, height);
    this.paintGlow(bg, width * 0.16, height * 0.08, 0xff4fd8, 220);
    this.paintGlow(bg, width * 0.88, height * 0.18, 0x33d1ff, 200);
    this.paintGlow(bg, width * 0.5, height * 0.96, 0xffd23f, 180);
    this.previewGfx = this.add.graphics().setDepth(20);

    const title = this.add
      .text(width / 2, width < 700 ? Math.max(height * 0.12, 96) : height * 0.12, BRAND.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: Math.min(72, width * 0.16) + 'px',
        color: '#f5f8ff',
        stroke: '#06121f',
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
        color: '#ffe28a',
        fontStyle: 'bold',
        backgroundColor: '#1a2438',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);

    const narrow = width < 700;
    const diffLabelY = narrow ? height * 0.22 + 32 : height * 0.26;
    this.add
      .text(width / 2, diffLabelY, t('menu.difficulty'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5);

    const diffRowY = narrow ? diffLabelY + 30 : height * 0.29;
    this.drawDifficultyRow(width, diffRowY, narrow);

    const diffTip =
      this.difficulty === 'practice'
        ? t('menu.practiceTip')
        : this.difficulty === 'easy'
          ? t('menu.easyTip')
          : this.difficulty === 'hard'
            ? t('menu.hardTip')
            : null;
    if (diffTip) {
      this.add
        .text(width / 2, narrow ? diffRowY + 30 : height * 0.325, diffTip, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#c8d8a8',
          align: 'center',
          wordWrap: { width: Math.min(420, width * 0.88) },
        })
        .setOrigin(0.5);
    }

    const mapLabelY = narrow
      ? diffRowY + (diffTip ? 56 : 36)
      : diffTip
        ? height * 0.355
        : height * 0.335;
    const mapRowY = narrow ? mapLabelY + 30 : diffTip ? height * 0.4 : height * 0.38;

    this.add
      .text(width / 2, mapLabelY, t('menu.map'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5);

    this.drawMapRow(width, mapRowY, narrow);

    const selectedMap = mapCopy(this.mapId);
    const mapTip = t('menu.mapTip', {
      label: selectedMap.label,
      blurb: selectedMap.blurb,
    });
    const mapTipY = mapRowY + (narrow ? 30 : height * 0.035);
    const mapTipText = this.add
      .text(width / 2, mapTipY, mapTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#a8c8c0',
        align: 'center',
        wordWrap: { width: Math.min(420, width * 0.88) },
      })
      .setOrigin(0.5);

    const pickSpeciesY = narrow
      ? mapTipY + mapTipText.height / 2 + 20
      : Math.max(height * 0.445, mapTipY + height * 0.03);
    const pickSpeciesText = this.add
      .text(width / 2, pickSpeciesY, t('menu.pickSpecies'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
        align: 'center',
        wordWrap: { width: Math.min(520, width * 0.9) },
      })
      .setOrigin(0.5);

    let cardsBottom = 0;
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
      const cardH = 92;
      const startY = pickSpeciesY + pickSpeciesText.height / 2 + 10 + cardH / 2;
      cardsBottom = startY + 2 * (cardH + 8) + cardH / 2;
      cards.forEach((c, i) => {
        const s = speciesCopy(c.id);
        this.makeSpeciesCard(
          c.id,
          width / 2,
          startY + i * (cardH + 8),
          s.name,
          s.motto,
          s.mechanic,
          c.fill,
          c.stroke,
          () => this.startMatch(c.id),
          Math.min(300, width * 0.88),
          cardH,
          c.id === this.lastSpecies,
        );
      });
    } else {
      const gap = Math.min(200, width * 0.28);
      const cardY = height * 0.58;
      cards.forEach((c, i) => {
        const s = speciesCopy(c.id);
        this.makeSpeciesCard(
          c.id,
          width / 2 + (i - 1) * gap,
          cardY,
          s.name,
          s.motto,
          s.mechanic,
          c.fill,
          c.stroke,
          () => this.startMatch(c.id),
          undefined,
          undefined,
          c.id === this.lastSpecies,
        );
      });
    }

    const volumeY = narrow ? cardsBottom + 34 : height * 0.76;
    createVolumeSlider({
      scene: this,
      x: width / 2,
      y: volumeY,
      width: Math.min(280, width * 0.7),
      depth: 30,
    });

    addLocalePicker({
      scene: this,
      x: width - Math.min(140, width * 0.28),
      y: Math.max(40, height * 0.055),
      depth: 40,
    });
    this.addTipsToggle(88, Math.max(40, height * 0.055));

    const strip = this.add
      .text(width / 2, narrow ? volumeY + 24 : height * 0.81, softLaunchStatusStrip(), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#7a8fa3',
        align: 'center',
        wordWrap: { width: width * 0.92 },
      })
      .setOrigin(0.5, narrow ? 0 : 0.5);
    const chipsY = narrow ? strip.y + strip.height + 22 : height * 0.855;

    const gap = Math.min(88, width * 0.22);
    this.add
      .text(width / 2 - gap * 1.5, chipsY, t('menu.friends'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#fff8e8',
        backgroundColor: '#2a3a50',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openLobby());
    this.add
      .text(width / 2 - gap * 0.5, chipsY, t('menu.cosmetics'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#fff8e8',
        backgroundColor: '#3a4a2a',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openCosmetics());
    this.accountLabel = this.add
      .text(width / 2 + gap * 0.5, chipsY, t('menu.account'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#fff8e8',
        backgroundColor: '#3a2a4a',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openAccount());
    this.refreshAccountChip();
    this.add
      .text(width / 2 + gap * 1.5, chipsY, t('menu.stats'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#fff8e8',
        backgroundColor: '#3a4555',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openStats());

    if (!narrow) {
      this.add
        .text(
          width / 2,
          height * 0.915,
          t('menu.hotkeys'),
          {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            color: '#6a7f94',
          },
        )
        .setOrigin(0.5);
    }

    const legalY = narrow ? chipsY + 34 : height * 0.97;
    this.addLegalFooter(width, legalY);

    if (narrow) {
      const contentBottom = legalY + 16;
      if (contentBottom > height) {
        this.menuZoom = height / contentBottom;
        bg.clear();
        bg.fillStyle(0x07111d, 1);
        const viewW = width / this.menuZoom;
        bg.fillRect(width / 2 - viewW / 2, 0, viewW, contentBottom);
      }
      this.fitMenuCamera();
    }
  }

  private fitMenuCamera(): void {
    this.cameras.main.setOrigin(0.5, 0).setScroll(0, 0).setZoom(this.menuZoom);
  }

  private resetMenuCamera(): void {
    this.cameras.main.setOrigin(0.5, 0.5).setScroll(0, 0).setZoom(1);
  }

  private buildShortLayout(intro: boolean, width: number, height: number): void {
    this.previewSlots = [];
    const bg = this.add.graphics();
    bg.fillStyle(0x07111d, 1);
    bg.fillRect(0, 0, width, height);
    this.paintGlow(bg, width * 0.1, 10, 0xff4fd8, 140);
    this.paintGlow(bg, width * 0.9, height * 0.3, 0x33d1ff, 120);
    this.previewGfx = this.add.graphics().setDepth(20);

    const title = this.add
      .text(width / 2, 16, BRAND.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '28px',
        color: '#f5f8ff',
        stroke: '#06121f',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    if (intro) {
      title.setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, duration: 400 });
    }

    this.add
      .text(width / 2, 40, BRAND.tagline, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#ffe28a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    addLocalePicker({
      scene: this,
      x: width - 128,
      y: 42,
      depth: 40,
    });
    this.addTipsToggle(78, 42);

    this.drawDifficultyRow(width, 78, true);

    const shortDiffTip =
      this.difficulty === 'practice'
        ? t('menu.practiceTip')
        : this.difficulty === 'easy'
          ? t('menu.easyTip')
          : this.difficulty === 'hard'
            ? t('menu.hardTip')
            : null;
    if (shortDiffTip) {
      this.add
        .text(width / 2, 98, shortDiffTip, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          color: '#c8d8a8',
          align: 'center',
          wordWrap: { width: Math.min(520, width * 0.92) },
        })
        .setOrigin(0.5);
    }

    const mapY = shortDiffTip ? 120 : 112;
    this.drawMapRow(width, mapY, true);

    const shortMap = mapCopy(this.mapId);
    const mapTipY = mapY + 20;
    this.add
      .text(
        width / 2,
        mapTipY,
        t('menu.mapTip', { label: shortMap.label, blurb: shortMap.blurb }),
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          color: '#a8c8c0',
          align: 'center',
          wordWrap: { width: Math.min(520, width * 0.92) },
        },
      )
      .setOrigin(0.5);

    const cards: {
      id: SpeciesId;
      fill: number;
      stroke: number;
    }[] = [
      { id: 'brutes', fill: 0x4a7a3a, stroke: 0xd4782e },
      { id: 'nobles', fill: 0x3d7ea6, stroke: 0xf0c75e },
      { id: 'weirdos', fill: 0x7a4aa8, stroke: 0x6ecfbf },
    ];
    const cardH = shortDiffTip ? 84 : 90;
    const cardW = Math.min(210, (width - 56) / 3);
    const step = cardW + 12;
    const cardY = mapTipY + 12 + cardH / 2;
    cards.forEach((c, i) => {
      const s = speciesCopy(c.id);
      this.makeSpeciesCard(
        c.id,
        width / 2 + (i - 1) * step,
        cardY,
        s.name,
        s.motto,
        s.mechanic,
        c.fill,
        c.stroke,
        () => this.startMatch(c.id),
        cardW,
        cardH,
        c.id === this.lastSpecies,
      );
    });

    const volumeY = Math.max(cardY + cardH / 2 + 30, height - 118);
    createVolumeSlider({
      scene: this,
      x: width / 2,
      y: volumeY,
      width: Math.min(240, width * 0.5),
      depth: 30,
    });

    const linkY = Math.max(volumeY + 40, height - 76);
    const gap = Math.min(88, width * 0.2);
    const link = (
      x: number,
      label: string,
      bgColor: string,
      onClick: () => void,
    ): Phaser.GameObjects.Text =>
      this.add
        .text(x, linkY, label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#fff8e8',
          backgroundColor: bgColor,
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', onClick);

    link(width / 2 - gap * 1.5, t('menu.friends'), '#2a3a50', () => this.openLobby());
    link(width / 2 - gap * 0.5, t('menu.cosmetics'), '#3a4a2a', () => this.openCosmetics());
    this.accountLabel = link(width / 2 + gap * 0.5, t('menu.account'), '#3a2a4a', () =>
      this.openAccount(),
    );
    this.refreshAccountChip();
    link(width / 2 + gap * 1.5, t('menu.stats'), '#3a4555', () => this.openStats());

    this.add
      .text(width / 2, Math.min(height - 34, linkY + 30), softLaunchStatusStrip(), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        color: '#7a8fa3',
      })
      .setOrigin(0.5);

    this.addLegalFooter(width, height - 14);
  }

  private addLegalFooter(width: number, legalY: number): void {
    const link = (
      x: number,
      label: string,
      onClick: () => void,
    ): Phaser.GameObjects.Text =>
      this.add
        .text(x, legalY, label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#7ec8ff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          playSfx('ui');
          onClick();
        });

    link(width / 2 - 100, t('menu.games'), () => {
      if (typeof window !== 'undefined') window.location.assign('/');
    });
    link(width / 2, t('menu.privacy'), () => {
      if (typeof window !== 'undefined') window.open('/privacy.html', '_blank');
    });
    link(width / 2 + 100, t('menu.terms'), () => {
      if (typeof window !== 'undefined') window.open('/terms.html', '_blank');
    });
  }

  private addTipsToggle(x: number, y: number): void {
    const label = this.add
      .text(x, y, isCoachSeen() ? t('menu.tipsOff') : t('menu.tipsOn'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff8e8',
        backgroundColor: '#1a2433',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0, 0.5)
      .setDepth(40)
      .setInteractive({ useHandCursor: true });
    label.on('pointerup', () => {
      setCoachSeen(!isCoachSeen());
      label.setText(isCoachSeen() ? t('menu.tipsOff') : t('menu.tipsOn'));
      playSfx('ui');
    });
  }

  private drawDifficultyRow(width: number, y: number, compact = false): void {
    const count = AI_DIFFICULTY_ORDER.length;
    const gap = Math.min(108, (width - 16) / count);
    const buttonW = Math.min(100, gap - 8);
    AI_DIFFICULTY_ORDER.forEach((id, i) => {
      const d = difficultyCopy(id);
      const selected = this.difficulty === id;
      const x = width / 2 + (i - (count - 1) / 2) * gap;
      const bg = this.add.graphics().setPosition(x, y);
      const btnFill = selected ? 0xffe28a : 0x12253c;
      const btnStroke = selected ? 0xc9a84c : 0x2a3a50;
      const btnH = compact ? 32 : 44;
      const btnRadius = compact ? 8 : 14;
      bg.fillStyle(btnFill, 0.95);
      bg.fillRoundedRect(-buttonW / 2, -btnH / 2, buttonW, btnH, btnRadius);
      bg.lineStyle(2, btnStroke, 1);
      bg.strokeRoundedRect(-buttonW / 2, -btnH / 2, buttonW, btnH, btnRadius);
      bg.setInteractive({ useHandCursor: true });
      this.add
        .text(x, compact ? y : y - 8, d.label, {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '15px',
          color: selected ? '#06121f' : '#f5f8ff',
        })
        .setOrigin(0.5);
      if (!compact) this.add
        .text(x, y + 12, d.blurb, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          color: '#9eb4c8',
          align: 'center',
          wordWrap: { width: Math.max(64, buttonW - 8) },
        })
        .setOrigin(0.5);
      bg.on('pointerup', () => {
        if (this.difficulty === id) return;
        this.difficulty = id;
        rememberMatchPrefs(this.lastSpecies, this.difficulty, this.mapId);
        playSfx('ui');
        this.tweens.killAll();
        this.children.removeAll(true);
        this.previewGfx = null;
        this.previewSlots = [];
        this.buildLayout(false);
      });
    });
  }

  private drawMapRow(width: number, y: number, compact = false): void {
    const count = SKIRMISH_MAP_ORDER.length;
    const gap = Math.min(150, (width - 16) / count);
    const buttonW = Math.min(140, gap - 10);
    SKIRMISH_MAP_ORDER.forEach((id, i) => {
      const m = mapCopy(id);
      const selected = this.mapId === id;
      const x = width / 2 + (i - (count - 1) / 2) * gap;
      const bg = this.add.graphics().setPosition(x, y);
      const btnFill = selected ? 0x3a4555 : 0x1a2433;
      const btnStroke = selected ? 0x6ecfbf : 0x3a4555;
      const btnH = compact ? 32 : 44;
      const btnRadius = compact ? 8 : 14;
      bg.fillStyle(btnFill, 0.95);
      bg.fillRoundedRect(-buttonW / 2, -btnH / 2, buttonW, btnH, btnRadius);
      bg.lineStyle(2, btnStroke, 1);
      bg.strokeRoundedRect(-buttonW / 2, -btnH / 2, buttonW, btnH, btnRadius);
      bg.setInteractive({ useHandCursor: true });
      this.add
        .text(x, compact ? y : y - 8, m.label, {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '15px',
          color: selected ? '#6ecfbf' : '#fff8e8',
        })
        .setOrigin(0.5);
      if (!compact) this.add
        .text(x, y + 12, m.blurb, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          color: '#9eb4c8',
          align: 'center',
          wordWrap: { width: Math.max(72, buttonW - 8) },
        })
        .setOrigin(0.5);
      bg.on('pointerup', () => {
        if (this.mapId === id) return;
        this.mapId = id;
        rememberMatchPrefs(this.lastSpecies, this.difficulty, this.mapId);
        playSfx('ui');
        this.tweens.killAll();
        this.children.removeAll(true);
        this.previewGfx = null;
        this.previewSlots = [];
        this.buildLayout(false);
      });
    });
  }

  private launchMatch(species: SpeciesId): void {
    this.lastSpecies = species;
    rememberMatchPrefs(species, this.difficulty, this.mapId);
    recordGameStarted(species);
    void maybeRecordCloudGameStarted(species);
    playSfx('ui');
    this.scene.start('KaneBattlefield', {
      species,
      difficulty: this.difficulty,
      mapId: this.mapId,
    });
  }

  private startMatch(species: SpeciesId): void {
    if (this.anyOverlayOpen()) return;
    if (isCloudAccount(getCurrentAuthUser())) {
      this.launchMatch(species);
      return;
    }
    this.accountOpen = true;
    showAuthPanel({
      mode: 'login',
      allowGuest: true,
      onAuthed: () => {
        this.accountOpen = false;
        this.refreshAccountChip();
        this.launchMatch(species);
      },
      onGuest: () => {
        this.accountOpen = false;
        this.launchMatch(species);
      },
      onClose: () => {
        this.accountOpen = false;
      },
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
    const compact = h <= 100;
    const radius = compact ? 10 : 18;
    const bg = this.add
      .graphics()
      .setPosition(x, y)
      .setInteractive({ useHandCursor: true });
    const cardFill = fill;
    const cardStroke = remembered ? 0xffe28a : stroke;
    bg.fillStyle(cardFill, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    bg.lineStyle(remembered ? 4 : 3, cardStroke, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    this.previewSlots.push({
      id: speciesId,
      x: compact ? x - w / 2 + 22 : x,
      y: y - 28,
      scale: compact ? 0.7 : 1.05,
    });
    this.add
      .text(x, compact ? y - 28 : y - 52, name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '16px',
        color: '#fff8e8',
      })
      .setOrigin(0.5);
    if (remembered && h > 120) {
      this.add
        .text(x, y - 68, t('menu.lastPlayed'), {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          color: '#f0c75e',
        })
        .setOrigin(0.5);
    }
    this.add
      .text(x, compact ? y + 2 : y + 8, motto, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        color: '#e8f0f8',
        align: 'center',
        wordWrap: { width: w - 16 },
      })
      .setOrigin(0.5);
    this.add
      .text(x, compact ? y + 22 : y + 36, mechanic, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#f0c75e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(x, compact ? y + 36 : y + 58, remembered ? t('menu.playLast') : t('menu.play'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#06121f',
        backgroundColor: '#ffe28a',
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.92));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', onClick);
  }
}