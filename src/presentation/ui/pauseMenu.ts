/**
 * In-match pause overlay — resume, mute, volume, rematch, quit to menu.
 * Also shows a frozen match-clock + supply snapshot.
 * ScrollFactor 0; ignore on the zoomed world camera.
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { isReduceMotion, setReduceMotion } from '../../database/motionPrefs';
import {
  difficultyCopy,
  mapCopy,
  speciesName,
  subscribeLocale,
  t,
} from '../../i18n';
import type { SkirmishMapId } from '../../data/skirmishMaps';
import type { SpeciesId } from '../../data/speciesStub';
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { isSfxMuted, playSfx, setSfxMuted } from '../audio/sfx';
import { formatMatchClock } from './battlefieldHud';
import { addLocalePicker } from './localePicker';
import { pauseDifficultyTipLine } from './pauseDifficultyTip';
import { pauseMapTipLine } from './pauseMapTip';
import { pauseSpeciesMottoTipLine } from './pauseSpeciesMottoTip';
import {
  SUPPLY_TONE_COLOR,
  formatSupplyLine,
  supplyTone,
} from './supplyTone';
import { createVolumeSlider, type VolumeSliderHandle } from './volumeSlider';

export interface PauseMenuSnapshot {
  elapsedMs: number;
  supplyCurrent: number;
  supplyCap: number;
  mapId: SkirmishMapId;
  difficulty: AiDifficultyId;
  speciesId: SpeciesId;
}

export interface PauseMenuOpts {
  scene: Phaser.Scene;
  onResume: () => void;
  /** Same species / difficulty / map — no menu hop. */
  onRematch: () => void;
  onQuit: () => void;
  ignoreOnMain: (objs: Phaser.GameObjects.GameObject[]) => void;
}

export class PauseMenu {
  private readonly scene: Phaser.Scene;
  private readonly onResume: () => void;
  private readonly onRematch: () => void;
  private readonly onQuit: () => void;
  private readonly ignoreOnMain: (objs: Phaser.GameObjects.GameObject[]) => void;
  private root: Phaser.GameObjects.GameObject[] = [];
  private muteLabel: Phaser.GameObjects.Text | null = null;
  private motionLabel: Phaser.GameObjects.Text | null = null;
  private volume: VolumeSliderHandle | null = null;
  private localeUnsub: (() => void) | null = null;
  private open = false;
  private snapshot: PauseMenuSnapshot = {
    elapsedMs: 0,
    supplyCurrent: 0,
    supplyCap: 36,
    mapId: 'crossing',
    difficulty: 'normal',
    speciesId: 'nobles',
  };

  constructor(opts: PauseMenuOpts) {
    this.scene = opts.scene;
    this.onResume = opts.onResume;
    this.onRematch = opts.onRematch;
    this.onQuit = opts.onQuit;
    this.ignoreOnMain = opts.ignoreOnMain;
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(snapshot?: PauseMenuSnapshot): void {
    if (snapshot) this.snapshot = snapshot;
    if (this.open) return;
    this.open = true;
    this.build();
    this.scene.scale.on('resize', this.onResize, this);
    this.localeUnsub = subscribeLocale(() => {
      this.scene.time.delayedCall(0, () => {
        if (this.open) this.onResize();
      });
    });
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    this.localeUnsub?.();
    this.localeUnsub = null;
    this.scene.scale.off('resize', this.onResize, this);
    this.volume?.destroy();
    this.volume = null;
    for (const o of this.root) o.destroy();
    this.root = [];
    this.muteLabel = null;
    this.motionLabel = null;
  }

  private onResize = (): void => {
    if (!this.open) return;
    this.volume?.destroy();
    this.volume = null;
    for (const o of this.root) o.destroy();
    this.root = [];
    this.muteLabel = null;
    this.motionLabel = null;
    this.build();
  };

  private build(): void {
    const { width, height } = this.scene.scale;
    const short = height < 500;
    const panelW = short ? Math.min(760, width - 24) : Math.min(360, width - 40);
    const panelH = short ? height - 16 : Math.min(600, height * 0.9);
    const cx = width / 2;
    const cy = short ? height / 2 : height * 0.48;
    const top = cy - panelH / 2;

    const dim = this.scene.add
      .rectangle(cx, height / 2, width, height, 0x060a12, 0.72)
      .setScrollFactor(0)
      .setDepth(220)
      .setInteractive();
    this.root.push(dim);

    const panel = this.scene.add
      .rectangle(cx, cy, panelW, panelH, 0x121c28, 0.96)
      .setStrokeStyle(2, 0xf0c75e, 0.85)
      .setScrollFactor(0)
      .setDepth(221);
    this.root.push(panel);

    const title = this.scene.add
      .text(cx, short ? top + 22 : cy - panelH * 0.44, t('pause.paused'), {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: (short ? 22 : Math.min(32, width * 0.08)) + 'px',
        color: '#f5e6c8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const brand = this.scene.add
      .text(cx, short ? top + 44 : cy - panelH * 0.36, BRAND.name, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#9eb4c8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);

    const clock = formatMatchClock(this.snapshot.elapsedMs);
    const elapsedLine = t('pause.elapsed', { clock });
    const mapTip = pauseMapTipLine(this.snapshot.mapId);
    const mottoTip = pauseSpeciesMottoTipLine(this.snapshot.speciesId);
    const difficultyTip = pauseDifficultyTipLine(this.snapshot.difficulty);
    const setupLine = t('pause.setup', {
      species: speciesName(this.snapshot.speciesId),
      map: mapCopy(this.snapshot.mapId).label,
      difficulty: difficultyCopy(this.snapshot.difficulty).label,
    });
    const supply = formatSupplyLine(
      this.snapshot.supplyCurrent,
      this.snapshot.supplyCap,
    );
    const tone = supplyTone(
      this.snapshot.supplyCurrent,
      this.snapshot.supplyCap,
    );
    const yElapsed = short ? top + 58 : cy - panelH * 0.34;
    const yMap = short ? top + 76 : cy - panelH * 0.28;
    const yMotto = short ? top + 94 : cy - panelH * 0.23;
    const yDifficulty = short ? top + 112 : cy - panelH * 0.18;
    const ySetup = short ? top + 128 : cy - panelH * 0.13;
    const ySupply = short ? top + 144 : cy - panelH * 0.07;
    const elapsed = this.scene.add
      .text(cx, yElapsed, elapsedLine, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '15px' : '16px',
        color: '#f5e6c8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const mapLine = this.scene.add
      .text(cx, yMap, mapTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const motto = this.scene.add
      .text(cx, yMotto, mottoTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#a8b8c8',
        align: 'center',
        wordWrap: { width: panelW - 40 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const difficultyLine = this.scene.add
      .text(cx, yDifficulty, difficultyTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
        wordWrap: { width: panelW - 40 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const setup = this.scene.add
      .text(cx, ySetup, setupLine, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#9eb4c8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const supplyText = this.scene.add
      .text(cx, ySupply, supply, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: SUPPLY_TONE_COLOR[tone],
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    this.root.push(
      title,
      brand,
      elapsed,
      mapLine,
      motto,
      difficultyLine,
      setup,
      supplyText,
    );

    // Short layout: elapsed + map + motto + difficulty + setup + supply need room.
    const btnY0 = short ? top + 172 : cy + panelH * 0.02;
    const gap = short ? 36 : Math.min(44, panelH * 0.11);
    this.root.push(
      this.makeBtn(cx, btnY0, t('pause.resume'), () => {
        this.hide();
        this.onResume();
      }, false, short),
    );
    this.muteLabel = this.makeBtn(cx, btnY0 + gap, this.muteText(), () => {
      setSfxMuted(!isSfxMuted());
      this.muteLabel?.setText(this.muteText());
      this.volume?.refresh();
      if (!isSfxMuted()) playSfx('ui');
    }, false, short);
    this.root.push(this.muteLabel);

    this.volume = createVolumeSlider({
      scene: this.scene,
      x: cx,
      y: short ? btnY0 + gap * 2 + 10 : btnY0 + gap * 2 + 8,
      width: Math.min(260, panelW - 48),
      depth: 222,
      scrollFactor: 0,
    });
    this.root.push(...this.volume.objects);

    this.motionLabel = this.makeBtn(
      cx,
      short ? btnY0 + gap * 3 + 8 : btnY0 + gap * 3 + 16,
      this.motionText(),
      () => {
        setReduceMotion(!isReduceMotion());
        this.motionLabel?.setText(this.motionText());
        playSfx('ui');
      },
      false,
      short,
    );
    this.root.push(this.motionLabel);

    this.root.push(
      this.makeBtn(
        cx,
        short ? btnY0 + gap * 4 + 8 : btnY0 + gap * 4 + 20,
        t('pause.rematch'),
        () => {
          playSfx('ui');
          this.hide();
          this.onRematch();
        },
        false,
        short,
      ),
    );

    this.root.push(
      this.makeBtn(
        cx,
        short ? btnY0 + gap * 5 + 10 : btnY0 + gap * 5 + 28,
        t('pause.quit'),
        () => {
          playSfx('ui');
          this.hide();
          this.onQuit();
        },
        true,
        short,
      ),
    );

    this.root.push(
      ...addLocalePicker({
        scene: this.scene,
        x: cx,
        y: short ? top + panelH - 22 : cy + panelH * 0.42,
        depth: 222,
        scrollFactor: 0,
      }),
    );

    this.ignoreOnMain(this.root);
  }

  private muteText(): string {
    return isSfxMuted() ? t('pause.soundOff') : t('pause.soundOn');
  }

  private motionText(): string {
    return isReduceMotion()
      ? t('pause.reduceMotionOn')
      : t('pause.reduceMotionOff');
  }

  private makeBtn(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    danger = false,
    compact = false,
  ): Phaser.GameObjects.Text {
    const btn = this.scene.add
      .text(x, y, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: compact ? '14px' : '16px',
        color: '#fff8e8',
        backgroundColor: danger ? '#5a3030' : '#2a4050',
        padding: { x: compact ? 16 : 28, y: compact ? 6 : 14 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setInteractive({ useHandCursor: true });
    btn.enableFilters();
    const glow = btn.filters?.internal.addGlow(
      danger ? 0xe87a7a : 0xf0c75e,
      3,
      0,
      1,
      false,
      4,
      6,
    );
    if (glow) glow.active = false;
    btn.on('pointerover', () => {
      btn.setStyle({ backgroundColor: danger ? '#7a4040' : '#3a5565' });
      if (glow) glow.active = true;
    });
    btn.on('pointerout', () => {
      btn.setStyle({ backgroundColor: danger ? '#5a3030' : '#2a4050' });
      if (glow) glow.active = false;
    });
    btn.on('pointerup', onClick);
    return btn;
  }
}
