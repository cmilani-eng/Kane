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
import { ensureAmbientBgm } from '../audio/bgm';
import { playSfx } from '../audio/sfx';
import { hideDomHud } from '../ui/domHud';
import { showAuthPanel, hideAuthPanel } from '../ui/authPanel';
import { showCosmeticsPanel } from '../ui/cosmeticsPanel';
import { showDashboardPanel } from '../ui/dashboardPanel';
import { showLobbyPanel } from '../ui/lobbyPanel';
import { hideMenuGamesLink, showMenuGamesLink } from '../ui/menuGamesLink';
import { softLaunchStatusStrip } from '../ui/softLaunchStatus';
import { showStatsPanel } from '../ui/statsPanel';
import { addLocalePicker } from '../ui/localePicker';
import { createVolumeSlider } from '../ui/volumeSlider';
import { drawSpeciesPreview } from '../units/unitSilhouette';

export class MenuScene extends Phaser.Scene {
  private statsOpen = false;
  private lobbyOpen = false;
  private cosmeticsOpen = false;
  private accountOpen = false;
  private authUnsub: (() => void) | null = null;
  private accountLabel: Phaser.GameObjects.Text | null = null;
  private difficulty: AiDifficultyId = 'normal';
  private mapId: SkirmishMapId = 'crossing';
  /** Last played / remembered species — highlighted on the menu. */
  private lastSpecies: SpeciesId = 'nobles';
  private previewGfx: Phaser.GameObjects.Graphics | null = null;
  private previewSlots: { id: SpeciesId; x: number; y: number; scale: number }[] = [];
  private localeUnsub: (() => void) | null = null;

  constructor() {
    super('Menu');
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
    // Ambient BGM needs a user gesture for autoplay policy.
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

  /** Locale changes destroy the text that received the click, so rebuild next tick. */
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
    showStatsPanel(
      this,
      () => {
        this.statsOpen = false;
      },
      { adminTools },
    );
  }

  private openLobby(): void {
    if (this.anyOverlayOpen()) return;
    this.lobbyOpen = true;
    playSfx('ui');
    showLobbyPanel(this, () => {
      this.lobbyOpen = false;
    });
  }

  private openCosmetics(): void {
    if (this.anyOverlayOpen()) return;
    this.cosmeticsOpen = true;
    playSfx('ui');
    showCosmeticsPanel(this, () => {
      this.cosmeticsOpen = false;
    });
  }

  private openAccount(): void {
    if (this.anyOverlayOpen()) return;
    this.accountOpen = true;
    playSfx('ui');
    showDashboardPanel(this, () => {
      this.accountOpen = false;
      this.refreshAccountChip();
    });
  }

  private refreshAccountChip(): void {
    if (!this.accountLabel) return;
    const u = getCurrentAuthUser();
    if (isCloudAccount(u) && u) {
      const short = (u.displayName || t('menu.account')).slice(0, 12);
      this.accountLabel.setText(short);
    } else {
      this.accountLabel.setText(t('menu.account'));
    }
  }

  private buildLayout(intro: boolean): void {
    const { width, height } = this.scale;
    // iPhone 17 landscape is wide (~874) and short (~402). Percentage rows overlap.
    if (height < 500) {
      this.buildShortLayout(intro, width, height);
      return;
    }
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
      .text(width / 2, height * 0.26, t('menu.difficulty'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5);

    this.drawDifficultyRow(width, height * 0.29);

    // One quiet line while Practice, Easy, or Hard is selected — no tip on Normal.
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
        .text(width / 2, height * 0.325, diffTip, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#c8d8a8',
          align: 'center',
          wordWrap: { width: Math.min(420, width * 0.88) },
        })
        .setOrigin(0.5);
    }

    const mapLabelY = diffTip ? height * 0.355 : height * 0.335;
    const mapRowY = diffTip ? height * 0.4 : height * 0.38;

    this.add
      .text(width / 2, mapLabelY, t('menu.map'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#b8c9d9',
      })
      .setOrigin(0.5);

    this.drawMapRow(width, mapRowY);

    // Quiet flavor line for the selected skirmish map (same pattern as difficulty tips).
    const selectedMap = mapCopy(this.mapId);
    const mapTip = t('menu.mapTip', {
      label: selectedMap.label,
      blurb: selectedMap.blurb,
    });
    const mapTipY = mapRowY + height * 0.035;
    this.add
      .text(width / 2, mapTipY, mapTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#a8c8c0',
        align: 'center',
        wordWrap: { width: Math.min(420, width * 0.88) },
      })
      .setOrigin(0.5);

    const pickSpeciesY = Math.max(height * 0.445, mapTipY + height * 0.03);
    this.add
      .text(width / 2, pickSpeciesY, t('menu.pickSpecies'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
        align: 'center',
        wordWrap: { width: Math.min(520, width * 0.9) },
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
      const startY = Math.max(height * 0.505, pickSpeciesY + height * 0.05);
      cards.forEach((c, i) => {
        const s = speciesCopy(c.id);
        this.makeSpeciesCard(
          c.id,
          width / 2,
          startY + i * 108,
          s.name,
          s.motto,
          s.mechanic,
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

    createVolumeSlider({
      scene: this,
      x: width / 2,
      y: height * 0.76,
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

    this.add
      .text(width / 2, height * 0.81, softLaunchStatusStrip(), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#7a8fa3',
      })
      .setOrigin(0.5);

    const gap = Math.min(88, width * 0.22);
    this.add
      .text(width / 2 - gap * 1.5, height * 0.855, t('menu.friends'), {
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
      .text(width / 2 - gap * 0.5, height * 0.855, t('menu.cosmetics'), {
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
      .text(width / 2 + gap * 0.5, height * 0.855, t('menu.account'), {
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
      .text(width / 2 + gap * 1.5, height * 0.855, t('menu.stats'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#fff8e8',
        backgroundColor: '#3a4555',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.openStats());

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

    this.addLegalFooter(width, height * 0.97);
  }

  /**
   * Landscape phone menu. Fixed bands so difficulty, maps, species cards,
   * and the footer each get their own row inside ~402px.
   */
  private buildShortLayout(intro: boolean, width: number, height: number): void {
    this.previewSlots = [];
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f1a2e, 0x0f1a2e, 0x1a3a4a, 0x243a28, 1);
    bg.fillRect(0, 0, width, height);
    this.previewGfx = this.add.graphics().setDepth(20);

    const title = this.add
      .text(width / 2, 16, BRAND.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '28px',
        color: '#f5e6c8',
        stroke: '#1a2a4a',
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
        color: '#f0c75e',
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

    // Compact difficulty buttons hide blurbs — tip only for Practice / Easy / Hard.
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

    // Compact map buttons hide per-tile blurbs — surface the selected map here.
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

  /** Games (hub) · Privacy · Terms footer row. */
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
      const bg = this.add
        .rectangle(x, y, buttonW, compact ? 32 : 44, selected ? 0x2a3a28 : 0x1a2433, 0.95)
        .setStrokeStyle(2, selected ? 0xf0c75e : 0x3a4555)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(x, compact ? y : y - 8, d.label, {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '15px',
          color: selected ? '#f0c75e' : '#fff8e8',
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
      const bg = this.add
        .rectangle(x, y, buttonW, compact ? 32 : 44, selected ? 0x2a2838 : 0x1a2433, 0.95)
        .setStrokeStyle(2, selected ? 0x6ecfbf : 0x3a4555)
        .setInteractive({ useHandCursor: true });
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
    this.scene.start('Battlefield', {
      species,
      difficulty: this.difficulty,
      mapId: this.mapId,
    });
  }

  /**
   * Start Game: signed-in (email or Firebase anonymous) → play;
   * else offer Login / Create / Play as guest (anonymous when SDK ready).
   */
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
        // Local-only fallback when Firebase env is missing.
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
    const bg = this.add
      .rectangle(x, y, w, h, fill, 1)
      .setStrokeStyle(remembered ? 4 : 3, remembered ? 0xf0c75e : stroke)
      .setInteractive({ useHandCursor: true });
    // Compact cards: the motto needs the full width, so the mascot sits beside the name.
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
        color: remembered ? '#f0c75e' : '#fff8e8',
      })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.92));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', onClick);
  }
}
