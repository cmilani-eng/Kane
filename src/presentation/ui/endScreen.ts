/**
 * Match end overlay — KANE-brand victory / defeat tone.
 * Procedural Phaser shapes + short tweens; mobile-friendly.
 */
import Phaser from 'phaser';
import { showPostMatchInterstitialStub } from '../../ads/adsSdkStub';
import { BRAND } from '../../config/brand';
import type { SkirmishMapId } from '../../data/skirmishMaps';
import type { SpeciesId } from '../../data/speciesStub';
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { offerPracticeStepUp } from '../../gameplay/battlefield/practiceStepUp';
import { difficultyCopy, mapCopy, speciesName, t } from '../../i18n';
import { playEndFanfare, playSfx } from '../audio/sfx';
import { formatMatchClock } from './matchClock';
import { copyEndShareLine, formatEndShareLine } from './endShareLine';

export interface EndScreenOpts {
  scene: Phaser.Scene;
  win: boolean;
  speciesId: SpeciesId;
  /** Skirmish map played (shown with match duration). */
  mapId?: SkirmishMapId;
  /** Match elapsed ms → mm:ss on the panel. */
  durationMs?: number;
  /** Surviving player units at end (same as match summary). */
  playerUnitsLeft?: number;
  /** Surviving player buildings at end (same as match summary). */
  playerBuildingsLeft?: number;
  /** Enemy units killed this match (tallied on remove). */
  playerUnitKills?: number;
  /** Player units lost this match (tallied on remove). */
  playerUnitLosses?: number;
  onMenu: () => void;
  /** Restart skirmish with the same species + difficulty. */
  onRematch: () => void;
  /** Difficulty just played. A Practice win can offer Easy. */
  difficulty?: AiDifficultyId;
  /** Start Easy with the same species and map. Shown only after a Practice win. */
  onStepUp?: () => void;
  /** Ignore these objects on the zoomed main camera. */
  ignoreOnMain: (objs: Phaser.GameObjects.GameObject[]) => void;
  /** Optional end reason for subtitle copy. */
  reason?: 'keep' | 'wipe' | 'core_hold' | null;
}

export function showKaneEndScreen(opts: EndScreenOpts): void {
  const {
    scene,
    win,
    speciesId,
    mapId,
    durationMs,
    playerUnitsLeft,
    playerBuildingsLeft,
    playerUnitKills,
    playerUnitLosses,
    onMenu,
    onRematch,
    ignoreOnMain,
    reason,
    difficulty,
    onStepUp,
  } = opts;
  const stepUp =
    offerPracticeStepUp(win, difficulty ?? 'normal') && onStepUp != null;
  const { width, height } = scene.scale;
  const accent = win ? 0xf0c75e : 0xe85a5a;
  const accentHex = win ? '#f0c75e' : '#e87a7a';
  const wash = win ? 0x1a2818 : 0x1a0e14;

  const root: Phaser.GameObjects.GameObject[] = [];

  const dim = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x060a12, 0.78)
    .setScrollFactor(0)
    .setDepth(200)
    .setAlpha(0);
  root.push(dim);

  const short = height < 500;
  const panelW = short ? Math.min(720, width - 24) : Math.min(440, width - 32);
  const panelH = short
    ? height - 16
    : Math.min(stepUp ? 540 : 480, height * (stepUp ? 0.84 : 0.76));
  const cy = short ? height / 2 : height * 0.48;
  const top = cy - panelH / 2;
  const yBrand = short ? top + 18 : cy - panelH * 0.4;
  const yTitle = short ? top + 58 : cy - panelH * 0.18;
  const yTag = short ? top + 90 : cy + panelH * 0.02;
  const ySub = short ? top + 112 : cy + panelH * 0.12;
  const yMeta = short ? top + 134 : cy + panelH * 0.2;
  const yRecap = short ? top + 154 : cy + panelH * 0.27;
  const yKill = short ? top + 168 : cy + panelH * 0.32;
  const yShare = short ? top + (stepUp ? 170 : 188) : cy + panelH * 0.38;
  const yStep = short ? top + panelH - 72 : cy + panelH * 0.44;
  const yActions = top + panelH - (short ? 28 : 36);
  const yRematch = short ? yActions : cy + panelH * (stepUp ? 0.56 : 0.48);
  const yMenu = short ? yActions : cy + panelH * (stepUp ? 0.68 : 0.6);
  const xRematch = short ? width / 2 - 110 : width / 2;
  const xMenu = short ? width / 2 + 110 : width / 2;
  const panel = scene.add
    .rectangle(width / 2, cy, panelW, panelH, wash, 0.92)
    .setStrokeStyle(2, accent, 0.85)
    .setScrollFactor(0)
    .setDepth(201)
    .setScale(0.92)
    .setAlpha(0);
  root.push(panel);

  // Soft atmosphere orbs
  const orbA = scene.add
    .circle(
      width / 2 - panelW * 0.28,
      height * 0.38,
      48,
      win ? 0x3d7ea6 : 0x7a2a3a,
      0.2,
    )
    .setScrollFactor(0)
    .setDepth(201);
  const orbB = scene.add
    .circle(
      width / 2 + panelW * 0.3,
      height * 0.58,
      36,
      win ? 0x4a7a3a : 0x4a2030,
      0.18,
    )
    .setScrollFactor(0)
    .setDepth(201);
  root.push(orbA, orbB);

  const brand = scene.add
    .text(width / 2, yBrand, BRAND.name, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: Math.min(28, width * 0.07) + 'px',
      color: '#f5e6c8',
      stroke: '#0a1220',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0);
  root.push(brand);

  const title = scene.add
    .text(width / 2, yTitle, win ? t('end.victory') : t('end.defeat'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: (short ? 28 : Math.min(58, width * 0.14)) + 'px',
      color: accentHex,
      stroke: '#0a1220',
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setScale(0.7)
    .setAlpha(0);
  root.push(title);

  const tag = scene.add
    .text(width / 2, yTag, BRAND.tagline, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: accentHex,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0);
  root.push(tag);

  const name = speciesName(speciesId);
  const subtitle =
    reason === 'core_hold'
      ? win
        ? t('end.coreVictoryBody', { species: name })
        : t('end.coreDefeatBody', { species: name })
      : win
        ? t('end.victoryBody', { species: name })
        : t('end.defeatBody', { species: name });

  const sub = scene.add
    .text(
      width / 2,
      ySub,
      subtitle,
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#d7e6f2',
        align: 'center',
        wordWrap: { width: panelW - 48 },
      },
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0);
  root.push(sub);

  const mapLabel = mapId ? mapCopy(mapId).label : '';
  const difficultyLabel = difficulty
    ? difficultyCopy(difficulty).label
    : '';
  const clock =
    durationMs != null ? formatMatchClock(durationMs) : '';
  const metaText =
    mapLabel && difficultyLabel && clock
      ? t('end.meta', {
          map: mapLabel,
          difficulty: difficultyLabel,
          clock,
        })
      : [mapLabel, difficultyLabel, clock].filter(Boolean).join('  ·  ');
  const meta = scene.add
    .text(width / 2, yMeta, metaText, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#9eb4c8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!metaText);
  root.push(meta);

  const hasRecap =
    playerUnitsLeft != null && playerBuildingsLeft != null;
  const recapText = hasRecap
    ? t('end.recap', {
        units: playerUnitsLeft,
        buildings: playerBuildingsLeft,
      })
    : '';
  const recap = scene.add
    .text(width / 2, yRecap, recapText, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#b8c9d9',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(hasRecap);
  root.push(recap);

  const hasKillRatio =
    playerUnitKills != null && playerUnitLosses != null;
  const killText = hasKillRatio
    ? t('end.killRatio', {
        kills: playerUnitKills,
        losses: playerUnitLosses,
      })
    : '';
  const killRatio = scene.add
    .text(width / 2, yKill, killText, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#a8bdd0',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(hasKillRatio);
  root.push(killRatio);

  const shareLine = formatEndShareLine({
    win,
    speciesName: name,
    mapLabel,
    difficultyLabel,
    clock,
    units: playerUnitsLeft,
    buildings: playerBuildingsLeft,
  });
  const shareBtn = scene.add
    .text(width / 2, yShare, t('end.shareCopy'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#c8d8e8',
      backgroundColor: '#1a2838',
      padding: { x: 12, y: 6 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => shareBtn.setStyle({ color: accentHex }))
    .on('pointerout', () => {
      if (shareBtn.text === t('end.shareCopied')) return;
      shareBtn.setStyle({ color: '#c8d8e8' });
    })
    .on('pointerup', () => {
      playSfx('ui');
      void copyEndShareLine(shareLine).then((ok) => {
        if (!ok) return;
        shareBtn.setText(t('end.shareCopied'));
        shareBtn.setStyle({ color: accentHex });
        scene.time.delayedCall(1600, () => {
          if (!shareBtn.active) return;
          shareBtn.setText(t('end.shareCopy'));
          shareBtn.setStyle({ color: '#c8d8e8' });
        });
      });
    });
  root.push(shareBtn);

  let stepBtn: Phaser.GameObjects.Text | null = null;
  if (stepUp && onStepUp) {
    const startEasy = onStepUp;
    const btn = scene.add
      .text(
        width / 2,
        yStep,
        t('end.tryEasy', { difficulty: difficultyCopy('easy').label }),
        {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: short ? '16px' : '18px',
          color: '#fff8e8',
          backgroundColor: '#3a5530',
          padding: { x: short ? 16 : 28, y: short ? 8 : 12 },
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(202)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setStyle({ color: accentHex }))
      .on('pointerout', () => btn.setStyle({ color: '#fff8e8' }))
      .on('pointerup', () => {
        playSfx('ui');
        startEasy();
      });
    stepBtn = btn;
    root.push(btn);
  }

  const rematchBtn = scene.add
    .text(xRematch, yRematch, t('end.rematch'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: short ? '16px' : '18px',
      color: '#fff8e8',
      backgroundColor: win ? '#3a5530' : '#553040',
      padding: { x: short ? 16 : 28, y: short ? 8 : 12 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => rematchBtn.setStyle({ color: accentHex }))
    .on('pointerout', () => rematchBtn.setStyle({ color: '#fff8e8' }))
    .on('pointerup', () => {
      playSfx('ui');
      onRematch();
    });
  root.push(rematchBtn);

  const menuBtn = scene.add
    .text(xMenu, yMenu, t('end.menu'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '16px',
      color: '#fff8e8',
      backgroundColor: win ? '#2a3a28' : '#3a2430',
      padding: { x: short ? 16 : 22, y: short ? 8 : 10 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => menuBtn.setStyle({ color: accentHex }))
    .on('pointerout', () => menuBtn.setStyle({ color: '#fff8e8' }))
    .on('pointerup', () => {
      playSfx('ui');
      onMenu();
    });
  root.push(menuBtn);

  ignoreOnMain(root);

  // Mute-aware procedural stinger (shared SFX mute / AudioContext).
  playEndFanfare(win);

  // Soft-launch: no-op while adsEnabled=false — never blocks Return to Menu.
  showPostMatchInterstitialStub();

  scene.tweens.add({
    targets: dim,
    alpha: 1,
    duration: 280,
    ease: 'Sine.easeOut',
  });
  scene.tweens.add({
    targets: panel,
    alpha: 1,
    scale: 1,
    duration: 420,
    ease: 'Back.easeOut',
  });
  scene.tweens.add({
    targets: [
      brand,
      tag,
      sub,
      meta,
      recap,
      killRatio,
      shareBtn,
      ...(stepBtn ? [stepBtn] : []),
      rematchBtn,
      menuBtn,
    ],
    alpha: 1,
    duration: 400,
    delay: 180,
    ease: 'Sine.easeOut',
  });
  scene.tweens.add({
    targets: title,
    alpha: 1,
    scale: 1,
    duration: 520,
    delay: 80,
    ease: 'Back.easeOut',
  });

  if (win) {
    scene.tweens.add({
      targets: orbA,
      y: orbA.y - 18,
      alpha: 0.32,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: orbB,
      y: orbB.y + 14,
      alpha: 0.28,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: title,
      y: title.y - 4,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  } else {
    scene.tweens.add({
      targets: title,
      x: title.x + 3,
      duration: 60,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: [orbA, orbB],
      alpha: 0.08,
      duration: 1800,
      yoyo: true,
      repeat: -1,
    });
  }
}
