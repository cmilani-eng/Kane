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
import {
  missionStateForDifficulty,
  pauseObjectiveTipLine,
  type MissionObjectiveId,
} from './missionObjective';
import { pauseCameraSectorTipLine } from './pauseCameraSectorTip';
import { pauseDifficultyTipLine } from './pauseDifficultyTip';
import { pauseFogAgeTipLine } from './pauseFogAgeTip';
import { pauseFogCoverageTipLine } from './pauseFogCoverageTip';
import { pauseMapTipLine } from './pauseMapTip';
import { pauseSpeciesMottoTipLine } from './pauseSpeciesMottoTip';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';
import { pauseSelectedSectorTipLine } from './pauseSelectedSectorTip';
import { pauseStockTipLine } from './pauseStockTip';
import { pauseApmTipLine } from './pauseApmTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseBuildingCountTipLine } from './pauseBuildingCountTip';
import { pauseIdleWorkersTipLine } from './pauseIdleWorkersTip';
import { pauseHeroStatusTipLine } from './pauseHeroStatusTip';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';
import { pauseFavoriteFactionTipLine } from './pauseFavoriteFactionTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';
import { pauseWinRateTipLine } from './pauseWinRateTip';
import { pauseAvgApmTipLine } from './pauseAvgApmTip';
import { pauseAvgDurationTipLine } from './pauseAvgDurationTip';
import { pauseLossStreakTipLine } from './pauseLossStreakTip';
import { pauseWinStreakTipLine } from './pauseWinStreakTip';
import type { MapSectorId } from '../../gameplay/battlefield/mapSector';
import type { MinimapHeroStatus } from './minimapHeroStatusTip';
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
  /** Current / last mission objective for the Objective tip. */
  objectiveId?: MissionObjectiveId;
  /** Camera view-center 3×3 sector frozen when pause opens. */
  camSector?: MapSectorId;
  /** Age of the last fog scout reveal (ms), frozen when pause opens. */
  fogAgeMs?: number;
  /** Explored fog coverage % (0–100), frozen when pause opens. */
  fogCoveragePct?: number;
  /** Living player units selected when pause opens. */
  selectionCount?: number;
  /** 3×3 sector of selection centroid when pause opens (if any selected). */
  selectedSector?: MapSectorId;
  /** Player gold in wallet when pause opens. */
  stockGold?: number;
  /** Player magic crystals in wallet when pause opens. */
  stockCrystals?: number;
  /** Player-issued commands so far (for APM tip). */
  playerActions?: number;
  /** Living player combat units when pause opens. */
  armyCount?: number;
  /** Living player buildings when pause opens. */
  buildingCount?: number;
  /** Idle player gatherers when pause opens (same countIdleWorkers as minimap). */
  idleWorkerCount?: number;
  /** Hero Ready / Down / sector when pause opens (same minimapHeroStatus). */
  heroStatus?: MinimapHeroStatus;
  /** Career win streak from matchPrefs when pause opens. */
  winStreak?: number;
  /** Career loss streak from matchPrefs when pause opens. */
  lossStreak?: number;
  /** Career finished matches from matchPrefs when pause opens. */
  gamesPlayed?: number;
  /** Career wins from matchPrefs when pause opens. */
  gamesWon?: number;
  /** Career average match duration from matchPrefs when pause opens. */
  avgDurationMs?: number;
  /** Career average APM from matchPrefs when pause opens. */
  avgApm?: number;
  /** Most-played species from matchPrefs.speciesPlays when pause opens. */
  favoriteFactionId?: SpeciesId | null;
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

    const clockTip = pauseMatchClockTipLine(this.snapshot.elapsedMs);
    const elapsedLine = t('pause.elapsed', {
      clock: formatMatchClock(this.snapshot.elapsedMs),
    });
    const mapTip = pauseMapTipLine(this.snapshot.mapId);
    const mottoTip = pauseSpeciesMottoTipLine(this.snapshot.speciesId);
    const difficultyTip = pauseDifficultyTipLine(this.snapshot.difficulty);
    const mission =
      this.snapshot.objectiveId != null
        ? { objectiveId: this.snapshot.objectiveId }
        : missionStateForDifficulty(this.snapshot.difficulty);
    const objectiveTip = pauseObjectiveTipLine(mission);
    const setupLine = t('pause.setup', {
      species: speciesName(this.snapshot.speciesId),
      map: mapCopy(this.snapshot.mapId).label,
      difficulty: difficultyCopy(this.snapshot.difficulty).label,
    });
    const camSectorTip =
      this.snapshot.camSector != null
        ? pauseCameraSectorTipLine(this.snapshot.camSector)
        : '';
    const fogAgeTip =
      this.snapshot.fogAgeMs != null
        ? pauseFogAgeTipLine(this.snapshot.fogAgeMs)
        : '';
    const fogCoverageTip = pauseFogCoverageTipLine(
      this.snapshot.fogCoveragePct ?? 0,
    );
    const selectionCountTip = pauseSelectionCountTipLine(
      this.snapshot.selectionCount ?? 0,
    );
    const selectedSectorTip =
      this.snapshot.selectedSector != null
        ? pauseSelectedSectorTipLine(this.snapshot.selectedSector)
        : '';
    const stockTip = pauseStockTipLine(
      this.snapshot.stockGold ?? 0,
      this.snapshot.stockCrystals ?? 0,
    );
    const populationTip = pausePopulationTipLine(
      this.snapshot.supplyCurrent,
    );
    const armyTip = pauseArmySizeTipLine(this.snapshot.armyCount ?? 0);
    const buildingsTip = pauseBuildingCountTipLine(
      this.snapshot.buildingCount ?? 0,
    );
    const idleTip = pauseIdleWorkersTipLine(
      this.snapshot.idleWorkerCount ?? 0,
    );
    const heroTip = pauseHeroStatusTipLine(
      this.snapshot.heroStatus ?? { kind: 'ready' },
    );
    const apmTip = pauseApmTipLine(
      this.snapshot.playerActions ?? 0,
      this.snapshot.elapsedMs,
    );
    const winStreakTip =
      pauseWinStreakTipLine(this.snapshot.winStreak ?? 0) ?? '';
    const lossStreakTip =
      pauseLossStreakTipLine(this.snapshot.lossStreak ?? 0) ?? '';
    const gamesPlayedTip =
      pauseGamesPlayedTipLine(this.snapshot.gamesPlayed ?? 0) ?? '';
    const winRateTip =
      pauseWinRateTipLine(
        this.snapshot.gamesWon ?? 0,
        this.snapshot.gamesPlayed ?? 0,
      ) ?? '';
    const avgDurationTip =
      pauseAvgDurationTipLine(this.snapshot.avgDurationMs) ?? '';
    const avgApmTip = pauseAvgApmTipLine(this.snapshot.avgApm) ?? '';
    const favoriteFactionTip =
      pauseFavoriteFactionTipLine(this.snapshot.favoriteFactionId) ?? '';
    const supplyRatioTip = pauseSupplyRatioTipLine(
      this.snapshot.supplyCurrent,
      this.snapshot.supplyCap,
    );
    const supply = formatSupplyLine(
      this.snapshot.supplyCurrent,
      this.snapshot.supplyCap,
    );
    const tone = supplyTone(
      this.snapshot.supplyCurrent,
      this.snapshot.supplyCap,
    );
    const yClock = short ? top + 56 : cy - panelH * 0.34;
    const yElapsed = short ? top + 70 : cy - panelH * 0.3;
    const yMap = short ? top + 84 : cy - panelH * 0.255;
    const yMotto = short ? top + 98 : cy - panelH * 0.21;
    const yDifficulty = short ? top + 112 : cy - panelH * 0.165;
    const yObjective = short ? top + 124 : cy - panelH * 0.12;
    const yCamSector = short ? top + 136 : cy - panelH * 0.08;
    const yFogAge = short ? top + 148 : cy - panelH * 0.05;
    const yFogCoverage = short ? top + 160 : cy - panelH * 0.02;
    const ySelection = short ? top + 172 : cy + panelH * 0.015;
    const ySelectedSector = short ? top + 184 : cy + panelH * 0.05;
    const yStock = short ? top + 196 : cy + panelH * 0.08;
    const ySetup = short ? top + 208 : cy + panelH * 0.105;
    const yPopulation = short ? top + 220 : cy + panelH * 0.13;
    const yArmy = short ? top + 232 : cy + panelH * 0.155;
    const yBuildings = short ? top + 244 : cy + panelH * 0.18;
    const yIdle = short ? top + 256 : cy + panelH * 0.205;
    const yHero = short ? top + 268 : cy + panelH * 0.23;
    const yApm = short ? top + 280 : cy + panelH * 0.26;
    const yWinStreak = short ? top + 292 : cy + panelH * 0.29;
    const yLossStreak = short ? top + 304 : cy + panelH * 0.315;
    const yGamesPlayed = short ? top + 316 : cy + panelH * 0.34;
    const yWinRate = short ? top + 328 : cy + panelH * 0.365;
    const yAvgDuration = short ? top + 340 : cy + panelH * 0.39;
    const yAvgApm = short ? top + 352 : cy + panelH * 0.415;
    const yFavoriteFaction = short ? top + 364 : cy + panelH * 0.44;
    const ySupplyRatio = short ? top + 376 : cy + panelH * 0.465;
    const ySupply = short ? top + 388 : cy + panelH * 0.49;
    const clockLine = this.scene.add
      .text(cx, yClock, clockTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '12px' : '13px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
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
    const objectiveLine = this.scene.add
      .text(cx, yObjective, objectiveTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
        wordWrap: { width: panelW - 40 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const camSectorLine = this.scene.add
      .text(cx, yCamSector, camSectorTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!camSectorTip);
    const fogAgeLine = this.scene.add
      .text(cx, yFogAge, fogAgeTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!fogAgeTip);
    const fogCoverageLine = this.scene.add
      .text(cx, yFogCoverage, fogCoverageTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const selectionLine = this.scene.add
      .text(cx, ySelection, selectionCountTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const selectedSectorLine = this.scene.add
      .text(cx, ySelectedSector, selectedSectorTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!selectedSectorTip);
    const stockLine = this.scene.add
      .text(cx, yStock, stockTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
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
    const populationLine = this.scene.add
      .text(cx, yPopulation, populationTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const armyLine = this.scene.add
      .text(cx, yArmy, armyTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const buildingsLine = this.scene.add
      .text(cx, yBuildings, buildingsTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const idleLine = this.scene.add
      .text(cx, yIdle, idleTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const heroLine = this.scene.add
      .text(cx, yHero, heroTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const apmLine = this.scene.add
      .text(cx, yApm, apmTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const winStreakLine = this.scene.add
      .text(cx, yWinStreak, winStreakTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!winStreakTip);
    const lossStreakLine = this.scene.add
      .text(cx, yLossStreak, lossStreakTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!lossStreakTip);
    const gamesPlayedLine = this.scene.add
      .text(cx, yGamesPlayed, gamesPlayedTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!gamesPlayedTip);
    const winRateLine = this.scene.add
      .text(cx, yWinRate, winRateTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!winRateTip);
    const avgDurationLine = this.scene.add
      .text(cx, yAvgDuration, avgDurationTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!avgDurationTip);
    const avgApmLine = this.scene.add
      .text(cx, yAvgApm, avgApmTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!avgApmTip);
    const favoriteFactionLine = this.scene.add
      .text(cx, yFavoriteFaction, favoriteFactionTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setVisible(!!favoriteFactionTip);
    const supplyRatioLine = this.scene.add
      .text(cx, ySupplyRatio, supplyRatioTip, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: short ? '11px' : '12px',
        color: '#c8d8e8',
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
      clockLine,
      elapsed,
      mapLine,
      motto,
      difficultyLine,
      objectiveLine,
      camSectorLine,
      fogAgeLine,
      fogCoverageLine,
      selectionLine,
      selectedSectorLine,
      stockLine,
      setup,
      populationLine,
      armyLine,
      buildingsLine,
      idleLine,
      heroLine,
      apmLine,
      winStreakLine,
      lossStreakLine,
      gamesPlayedLine,
      winRateLine,
      avgDurationLine,
      avgApmLine,
      favoriteFactionLine,
      supplyRatioLine,
      supplyText,
    );

    // Short layout: tips + setup + supply need room above buttons.
    const btnY0 = short ? top + 412 : cy + panelH * 0.52;
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
