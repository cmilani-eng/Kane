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
import { nextMapAfterHardWin } from '../../gameplay/battlefield/mapStepUp';
import { nextSpeciesAfterCatalog } from '../../gameplay/battlefield/speciesStepUp';
import {
  nextDifficultyAfterWin,
  previousDifficultyAfterLoss,
} from '../../gameplay/battlefield/practiceStepUp';
import { difficultyCopy, mapCopy, speciesName, t } from '../../i18n';
import { playEndFanfare, playSfx } from '../audio/sfx';
import { endDifficultyPlayedTipLine } from './endDifficultyPlayedTip';
import { endDurationTipLine } from './endDurationTip';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { endObjectiveResultTipLine } from './endObjectiveResultTip';
import { endSpeciesPlayedTipLine } from './endSpeciesPlayedTip';
import { endBuildingsLostTipLine } from './endBuildingsLostTip';
import { endBuildingsRaisedTipLine } from './endBuildingsRaisedTip';
import { endKillsTipLine } from './endKillsTip';
import { endUnitsLostTipLine } from './endUnitsLostTip';
import { endUnitsTrainedTipLine } from './endUnitsTrainedTip';
import { endResourcesGatheredTipLine } from './endResourcesGatheredTip';
import { endApmTipLine } from './endApmTip';
import { endEfficiencyTipLine } from './endEfficiencyTip';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { endWinStreakTipLine } from './endWinStreakTip';
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
  /** Player units finished from production this match. */
  playerUnitsTrained?: number;
  /** Player buildings finished from construction this match. */
  playerBuildingsRaised?: number;
  /** Player buildings destroyed this match. */
  playerBuildingsLost?: number;
  /** Gold deposited at Keep this match. */
  playerGoldGathered?: number;
  /** Magic crystals deposited at Keep this match. */
  playerCrystalsGathered?: number;
  /** Player-issued commands this match (for APM tip). */
  playerActions?: number;
  onMenu: () => void;
  /** Restart skirmish with the same species + difficulty. */
  onRematch: () => void;
  /** Difficulty just played. A win can offer the next difficulty. */
  difficulty?: AiDifficultyId;
  /** Start the next difficulty after a win, or the previous one after a loss. */
  onStepUp?: () => void;
  /** Start the next map at Hard with the same species. Shown only after a Hard win. */
  onTryMap?: () => void;
  /** Start the next species at Hard on the first map. Shown after a Hard win on the last map. */
  onTrySpecies?: () => void;
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
    playerUnitsTrained,
    playerBuildingsRaised,
    playerBuildingsLost,
    playerGoldGathered,
    playerCrystalsGathered,
    playerActions,
    onMenu,
    onRematch,
    ignoreOnMain,
    reason,
    difficulty,
    onStepUp,
    onTryMap,
    onTrySpecies,
  } = opts;
  const played = difficulty ?? 'normal';
  const stepUpTo =
    nextDifficultyAfterWin(win, played) ??
    previousDifficultyAfterLoss(win, played);
  const speciesOffer =
    mapId != null
      ? nextSpeciesAfterCatalog(win, difficulty ?? 'normal', mapId, speciesId)
      : null;
  const mapOffer =
    speciesOffer == null && mapId != null
      ? nextMapAfterHardWin(win, difficulty ?? 'normal', mapId)
      : null;
  const stepUp =
    (stepUpTo != null && onStepUp != null) ||
    (speciesOffer != null && onTrySpecies != null) ||
    (mapOffer != null && onTryMap != null);
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
    : Math.min(stepUp ? 720 : 660, height * (stepUp ? 0.96 : 0.92));
  const cy = short ? height / 2 : height * 0.48;
  const top = cy - panelH / 2;
  const yBrand = short ? top + 18 : cy - panelH * 0.4;
  const yTitle = short ? top + 58 : cy - panelH * 0.18;
  const yTag = short ? top + 90 : cy + panelH * 0.02;
  const ySub = short ? top + 108 : cy + panelH * 0.1;
  const yMeta = short ? top + 128 : cy + panelH * 0.17;
  const yActions = top + panelH - (short ? 28 : 36);
  // Short screens: two columns of eight stat lines so the actions stay on-panel.
  const statRowY = (i: number) => top + 140 + (i % 8) * 13;
  const statX = (i: number) =>
    short ? width / 2 + (i < 8 ? -1 : 1) * (panelW / 4) : width / 2;
  const yDuration = short ? statRowY(0) : cy + panelH * 0.2;
  const ySpecies = short ? statRowY(1) : cy + panelH * 0.24;
  const yMap = short ? statRowY(2) : cy + panelH * 0.28;
  const yDifficulty = short ? statRowY(3) : cy + panelH * 0.32;
  const yObjective = short ? statRowY(4) : cy + panelH * 0.36;
  const yRecap = short ? statRowY(5) : cy + panelH * 0.4;
  const yApm = short ? statRowY(6) : cy + panelH * 0.44;
  const yEfficiency = short ? statRowY(7) : cy + panelH * 0.48;
  const yTrained = short ? statRowY(8) : cy + panelH * 0.52;
  const yRaised = short ? statRowY(9) : cy + panelH * 0.555;
  const yKills = short ? statRowY(10) : cy + panelH * 0.59;
  const yLost = short ? statRowY(11) : cy + panelH * 0.625;
  const yBldLost = short ? statRowY(12) : cy + panelH * 0.66;
  const yKill = short ? statRowY(13) : cy + panelH * 0.695;
  const yGathered = short ? statRowY(14) : cy + panelH * 0.73;
  const yStreak = short ? statRowY(15) : cy + panelH * 0.745;
  const yBestStreak = short ? yActions - 58 : cy + panelH * 0.76;
  const yShare = short ? yActions - 44 : cy + panelH * 0.785;
  const yStep = short ? yActions - 44 : cy + panelH * 0.72;
  const yRematch = short ? yActions : cy + panelH * (stepUp ? 0.8 : 0.76);
  const yMenu = short ? yActions : cy + panelH * (stepUp ? 0.91 : 0.85);
  const xRematch = short ? width / 2 - 110 : width / 2;
  const xMenu = short ? width / 2 + 110 : width / 2;
  const xShare = short && stepUp ? width / 2 - 100 : width / 2;
  const xStep = short ? width / 2 + 100 : width / 2;
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

  const durationTip =
    durationMs != null ? endDurationTipLine(durationMs) : '';
  const duration = scene.add
    .text(statX(0), yDuration, durationTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!durationTip);
  root.push(duration);

  const speciesTip = endSpeciesPlayedTipLine(speciesId);
  const species = scene.add
    .text(statX(1), ySpecies, speciesTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!speciesTip);
  root.push(species);

  const mapTip = mapId ? endMapPlayedTipLine(mapId) : '';
  const mapTipText = scene.add
    .text(statX(2), yMap, mapTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!mapTip);
  root.push(mapTipText);

  const difficultyTip = difficulty
    ? endDifficultyPlayedTipLine(difficulty)
    : '';
  const difficultyTipText = scene.add
    .text(statX(3), yDifficulty, difficultyTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!difficultyTip);
  root.push(difficultyTipText);

  const objectiveTip = endObjectiveResultTipLine(win, reason) ?? '';
  const objectiveTipText = scene.add
    .text(statX(4), yObjective, objectiveTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!objectiveTip);
  root.push(objectiveTipText);

  const trainedTip =
    playerUnitsTrained != null
      ? endUnitsTrainedTipLine(playerUnitsTrained)
      : '';
  const trainedTipText = scene.add
    .text(statX(8), yTrained, trainedTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!trainedTip);
  root.push(trainedTipText);

  const raisedTip =
    playerBuildingsRaised != null
      ? endBuildingsRaisedTipLine(playerBuildingsRaised)
      : '';
  const raisedTipText = scene.add
    .text(statX(9), yRaised, raisedTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!raisedTip);
  root.push(raisedTipText);

  const killsTip =
    playerUnitKills != null ? endKillsTipLine(playerUnitKills) : '';
  const killsTipText = scene.add
    .text(statX(10), yKills, killsTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!killsTip);
  root.push(killsTipText);

  const lostTip =
    playerUnitLosses != null
      ? endUnitsLostTipLine(playerUnitLosses)
      : '';
  const lostTipText = scene.add
    .text(statX(11), yLost, lostTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!lostTip);
  root.push(lostTipText);

  const bldLostTip =
    playerBuildingsLost != null
      ? endBuildingsLostTipLine(playerBuildingsLost)
      : '';
  const bldLostTipText = scene.add
    .text(statX(12), yBldLost, bldLostTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!bldLostTip);
  root.push(bldLostTipText);

  const hasRecap =
    playerUnitsLeft != null && playerBuildingsLeft != null;
  const recapText = hasRecap
    ? t('end.recap', {
        units: playerUnitsLeft,
        buildings: playerBuildingsLeft,
      })
    : '';
  const recap = scene.add
    .text(statX(5), yRecap, recapText, {
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
    .text(statX(13), yKill, killText, {
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

  const hasGathered =
    playerGoldGathered != null && playerCrystalsGathered != null;
  const gatheredTip = hasGathered
    ? endResourcesGatheredTipLine(
        playerGoldGathered,
        playerCrystalsGathered,
      )
    : '';
  const gathered = scene.add
    .text(statX(14), yGathered, gatheredTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!gatheredTip);
  root.push(gathered);

  const hasApm = playerActions != null && durationMs != null;
  const apmTip = hasApm
    ? endApmTipLine(playerActions, durationMs)
    : '';
  const apmTipText = scene.add
    .text(statX(6), yApm, apmTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!apmTip);
  root.push(apmTipText);

  const efficiencyTip =
    playerUnitKills != null && playerUnitLosses != null
      ? endEfficiencyTipLine(playerUnitKills, playerUnitLosses) ?? ''
      : '';
  const efficiencyTipText = scene.add
    .text(statX(7), yEfficiency, efficiencyTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!efficiencyTip);
  root.push(efficiencyTipText);

  const streakTip = endWinStreakTipLine() ?? '';
  const streakTipText = scene.add
    .text(statX(15), yStreak, streakTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!streakTip);
  root.push(streakTipText);

  const bestStreakTip = endBestWinStreakTipLine() ?? '';
  const bestStreakTipText = scene.add
    .text(width / 2, yBestStreak, bestStreakTip, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c8d8e8',
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(202)
    .setAlpha(0)
    .setVisible(!!bestStreakTip);
  root.push(bestStreakTipText);

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
    .text(xShare, yShare, t('end.shareCopy'), {
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

  const offer =
    stepUpTo && onStepUp
      ? {
          label: t('end.tryEasy', {
            difficulty: difficultyCopy(stepUpTo).label,
          }),
          go: onStepUp,
        }
      : speciesOffer && onTrySpecies
        ? {
            label: t('end.trySpecies', {
              species: speciesName(speciesOffer.species),
            }),
            go: onTrySpecies,
          }
        : mapOffer && onTryMap
          ? {
              label: t('end.tryMap', { map: mapCopy(mapOffer).label }),
              go: onTryMap,
            }
          : null;

  let stepBtn: Phaser.GameObjects.Text | null = null;
  if (offer) {
    const go = offer.go;
    const btn = scene.add
      .text(
        xStep,
        yStep,
        offer.label,
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
        go();
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
      duration,
      species,
      mapTipText,
      difficultyTipText,
      objectiveTipText,
      trainedTipText,
      raisedTipText,
      killsTipText,
      lostTipText,
      bldLostTipText,
      recap,
      killRatio,
      gathered,
      apmTipText,
      efficiencyTipText,
      streakTipText,
      bestStreakTipText,
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
