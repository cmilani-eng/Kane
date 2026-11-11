/**
 * Kane Battlefield Scene — main gameplay for Kane game.
 * Based on src/presentation/scenes/BattlefieldScene.ts with Kane-specific navigation.
 * Navigation: Menu -> GamePicker, Rematch -> KaneBattlefield
 *
 * Called by: src/games/kane/index.ts (exports for registry)
 * Replaces: src/presentation/scenes/BattlefieldScene.ts (for Kane-specific battlefield)
 * Reads: Same data as original BattlefieldScene
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import { buildingDisplayName, t, unitDisplayName } from '../../i18n';
import { RESOURCES } from '../../data/resources';
import {
  getBuildingType,
  placeableBuildings,
  type BuildingTypeId,
} from '../../data/buildings';
import { type SpeciesId } from '../../data/speciesStub';
import type { SkirmishMapId } from '../../data/skirmishMaps';
import {
  getAiDifficulty,
  type AiDifficultyId,
} from '../../gameplay/battlefield/aiDifficulty';
import { nextMapAfterHardWin } from '../../gameplay/battlefield/mapStepUp';
import { nextSpeciesAfterCatalog } from '../../gameplay/battlefield/speciesStepUp';
import {
  nextDifficultyAfterWin,
  previousDifficultyAfterLoss,
} from '../../gameplay/battlefield/practiceStepUp';
import {
  createAiState,
  tickBattlefieldAi,
  type AiState,
} from '../../gameplay/battlefield/battlefieldAi';
import {
  tickFormations,
  toggleFormationSelected,
} from '../../gameplay/battlefield/battlefieldFormations';
import {
  castHeroAbility,
  tickHeroes,
} from '../../gameplay/battlefield/battlefieldHeroes';
import {
  tickMutations,
  toggleMutationSelected,
} from '../../gameplay/battlefield/battlefieldMutations';
import {
  tickRage,
  toggleRageSelected,
} from '../../gameplay/battlefield/battlefieldRage';
import { tickCoreFragments } from '../../gameplay/battlefield/battlefieldCoreFragments';
import { BattlefieldHud } from '../../presentation/ui/battlefieldHud';
import { Minimap } from '../../presentation/ui/minimap';
import {
  buildSelectionView,
  flashQueueCancel,
  flashStanceHotkey,
  mountSelectionPanel,
  renderSelectionPanel,
  selectionPanelInsetPx,
  unmountSelectionPanel,
} from '../../presentation/ui/selectionPanel';
import { CoreVictoryBanner } from '../../presentation/ui/coreVictoryBanner';
import { TutorialCoach } from '../../presentation/ui/tutorialCoach';
import {
  createTutorialState,
  tickTutorial,
  type TutorialState,
} from '../../gameplay/battlefield/battlefieldTutorial';
import {
  buildingBlocks,
  canAfford,
  findBuildingAt,
  placeBuilding,
  snapBuildingWorld,
  tickBuildings,
} from '../../gameplay/battlefield/battlefieldBuildings';
import {
  findEnemyAt,
  issueAttackSelected,
  livingByTeam,
  tickBattlefieldCombat,
} from '../../gameplay/battlefield/battlefieldCombat';
import {
  findNodeAt,
  issueGatherSelected,
  tickBattlefieldEconomy,
  walletOf,
} from '../../gameplay/battlefield/battlefieldEconomy';
import { tickEconomyFx } from '../../gameplay/battlefield/battlefieldEconomyFx';
import {
  cancelQueuedTrain,
  queueTrain,
  tickProduction,
  trainHotkey,
} from '../../gameplay/battlefield/battlefieldProduction';
import {
  evaluateMatch,
  matchEndReason,
  type MatchResult,
} from '../../gameplay/battlefield/battlefieldVictory';
import {
  addToControlGroup,
  assignControlGroup,
  createControlGroups,
  issueAttackMoveSelected,
  recallControlGroup,
  stopSelected,
  type ControlGroups,
} from '../../gameplay/battlefield/battlefieldOrders';
import {
  stepSubgroup,
  type SubgroupCycle,
} from '../../gameplay/battlefield/battlefieldSubgroups';
import {
  groupCenter,
  GroupTapTracker,
  shouldCountGroupHotkey,
} from '../../gameplay/battlefield/battlefieldGroupFocus';
import { selectsWholeType } from '../../gameplay/battlefield/battlefieldSelectClick';
import { countIdleWorkers } from '../../gameplay/battlefield/idleWorkers';
import { isMilitaryUnit } from '../../gameplay/battlefield/selectMilitary';
import { minimapHeroStatus } from '../../presentation/ui/minimapHeroStatusTip';
import { touchLongPressAction } from '../../gameplay/battlefield/touchLongPress';
import {
  spawnControlGroupAssignFx,
  spawnControlGroupRecallFx,
  tickControlGroupFx,
} from '../../gameplay/battlefield/battlefieldControlGroupFx';
import {
  spawnStopPulses,
  tickStopFx,
} from '../../gameplay/battlefield/battlefieldStopFx';
import { tickWaypointMarkers } from '../../gameplay/battlefield/battlefieldWaypointMarkers';
import { findPlayerBasePoint } from '../../gameplay/battlefield/playerBase';
import {
  clearSelection,
  createBattlefieldWorld,
  findPlayerUnitAt,
  issueMoveSelected,
  recordPlayerAction,
  selectAllVisibleSameType,
  selectAt,
  selectInRect,
  selectedCount,
  selectedUnits,
  tickBattlefield,
  type BattlefieldBuilding,
  type BattlefieldWorld,
  type ResourceNode,
} from '../../gameplay/battlefield/battlefieldWorld';
import {
  enemyRevealed,
  isExplored,
  tickFog,
} from '../../gameplay/battlefield/battlefieldFog';
import { tickAttentionPings } from '../../gameplay/battlefield/battlefieldAttentionPing';
import {
  spawnScoutPulsesFromFog,
  tickScoutPulses,
} from '../../gameplay/battlefield/battlefieldScoutPulse';
import {
  makeMatchSummaryId,
} from '../../database/matchSummary';
import { getEquippedSkin } from '../../database/cosmeticsLoadout';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { favoriteFactionId } from '../../presentation/ui/lobbyFavoriteFactionTip';
import { isCoachSeen } from '../../database/coachPrefs';
import { isReduceMotion } from '../../database/motionPrefs';
import { rematchPrefsFromWorld } from '../../gameplay/battlefield/rematchPrefs';
import { recordGameStarted } from '../../database/localStats';
import { writeMatchSummaryFunctionStub } from '../../server/matchSummaryFunctionStub';
import {
  maybeRecordCloudGameStarted,
  maybeWriteCloudMatch,
} from '../../firebase/cloudProgression';
import { ensureAmbientBgm } from '../../presentation/audio/bgm';
import { playSfx } from '../../presentation/audio/sfx';
import { RtsCamera } from '../../presentation/camera/rtsCamera';
import { createSkirmishMap } from '../../presentation/maps/mapManager';
import { FogOverlay } from '../../presentation/ui/fogOverlay';
import { showKaneEndScreen } from '../../presentation/ui/endScreen';
import { resolveMissionObjective } from '../../presentation/ui/missionObjective';
import { minimapCameraSectorAt } from '../../presentation/ui/minimapCameraSectorTip';
import { fogExploredCoveragePct } from '../../presentation/ui/minimapFogCoverageTip';
import { maxPlayerVisionTiles } from '../../presentation/ui/minimapVisionTip';
import { pauseSelectedSectorAt } from '../../presentation/ui/pauseSelectedSectorTip';
import { PauseMenu } from '../../presentation/ui/pauseMenu';
import { publishMatchStock, resetMatchStock } from '../../presentation/ui/matchUiStore';
import {
  layoutStockStrip,
  mountStockStrip,
  unmountStockStrip,
} from '../../presentation/ui/stockStrip';
import {
  createControlsHelpPanel,
  type ControlsHelpHandle,
} from '../../presentation/ui/controlsHelpPanel';
import { drawBuildingSilhouette } from '../../presentation/buildings/buildingSilhouette';
import {
  enemyBuildingGhostAlpha,
  noteEnemyBuildingVisible,
  pruneBuildingGhosts,
} from '../../presentation/fx/buildingLastSeenGhost';
import {
  drawPlacementGhost,
  placementFootprintSize,
} from '../../presentation/buildings/placementGhost';
import { drawProductionQueueFeedback } from '../../presentation/buildings/productionQueueFeedback';
import { drawResourceNodeSilhouette } from '../../presentation/resources/resourceNodeSilhouette';
import { drawCombatFxList } from '../../presentation/fx/combatFxDraw';
import { drawCoreFragments } from '../../presentation/fx/coreFragmentDraw';
import { drawEconomyFxList } from '../../presentation/fx/economyFxDraw';
import { drawFormationVisuals } from '../../presentation/fx/formationVisual';
import {
  drawAttackMoveReticle,
  drawAttackMoveScreenTint,
  setAttackMoveCursor,
} from '../../presentation/fx/attackMoveFeedback';
import { drawUnderAttackEdgeFlash } from '../../presentation/fx/underAttackAlert';
import { drawHeroAbilityVfxList } from '../../presentation/fx/heroAbilityVfx';
import { drawMutationVisuals } from '../../presentation/fx/mutationVisual';
import { drawRageVisuals } from '../../presentation/fx/rageVisual';
import { drawControlGroupFxList } from '../../presentation/fx/controlGroupFeedback';
import { drawStopFxList } from '../../presentation/fx/stopCommandFeedback';
import { drawWaypointMarkers } from '../../presentation/fx/waypointMarkersDraw';
import { ControlGroupBadgeLayer } from '../../presentation/fx/controlGroupBadges';
import { RallyDistanceLabel } from '../../presentation/fx/rallyDistanceLabel';
import { BuildingGhostAgeLabels } from '../../presentation/fx/buildingGhostAgeLabel';
import { drawBuildingRallyMarkers } from '../../presentation/fx/rallyMarkerDraw';
import { drawGatherTargetHighlights } from '../../presentation/fx/gatherTargetHighlight';
import { drawAttentionPingList } from '../../presentation/fx/attentionPingDraw';
import { drawScoutPulseList } from '../../presentation/fx/scoutPulseDraw';
import {
  buildingCanRally,
  clearBuildingRally,
  setBuildingRally,
} from '../../gameplay/battlefield/battlefieldRally';
import {
  drawUnitSilhouette,
  resolveUnitAnimPhase,
} from '../../presentation/units/unitSilhouette';
import {
  inView,
  MOBILE_PERF,
  viewBoundsFromCamera,
  type ViewBounds,
} from '../../presentation/perf/mobileBudget';

type PointerMode =
  | 'none'
  | 'select'
  | 'box'
  | 'pan'
  | 'place'
  | 'attackMove'
  | 'rally';

export class KaneBattlefieldScene extends Phaser.Scene {
  private world!: BattlefieldWorld;
  private cameraCtl!: RtsCamera;
  private hudCam!: Phaser.Cameras.Scene2D.Camera;
  private boxGfx!: Phaser.GameObjects.Graphics;
  private unitGfx!: Phaser.GameObjects.Graphics;
  private ghostGfx!: Phaser.GameObjects.Graphics;
  private amoveTintGfx!: Phaser.GameObjects.Graphics;
  private amoveReticleGfx!: Phaser.GameObjects.Graphics;
  private underAttackGfx!: Phaser.GameObjects.Graphics;
  private fogOverlay!: FogOverlay;
  private mode: PointerMode = 'none';
  private pointerStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  private cameraStart = { x: 0, y: 0 };
  private amovePointer = { x: 0, y: 0 };
  private hud!: BattlefieldHud;
  private pauseMenu!: PauseMenu;
  private pauseBlur: Phaser.Filters.Blur | null = null;
  private controlsHelp!: ControlsHelpHandle;
  private paused = false;
  private minimap!: Minimap;
  private tutorial!: TutorialState;
  private coach!: TutorialCoach;
  private coreBanner!: CoreVictoryBanner;
  private groupBadges!: ControlGroupBadgeLayer;
  private rallyDistLabel!: RallyDistanceLabel;
  private ghostAgeLabels!: BuildingGhostAgeLabels;
  private shiftKey: Phaser.Input.Keyboard.Key | null = null;
  private ctrlKey: Phaser.Input.Keyboard.Key | null = null;
  private altKey: Phaser.Input.Keyboard.Key | null = null;
  private controlGroups!: ControlGroups;
  private groupTaps = new GroupTapTracker();
  private subgroupCycle: SubgroupCycle | null = null;
  private touchOrderPress: {
    pointerId: number;
    sx: number;
    sy: number;
    wx: number;
    wy: number;
    at: number;
  } | null = null;
  private placeables: BuildingTypeId[] = [];
  private placeIndex = 0;
  private placeType: BuildingTypeId = 'bonker_hut';
  private ghostPos = { x: 0, y: 0 };
  private ghostValid = false;
  private selectedBuilding: BattlefieldBuilding | null = null;
  private selectedNode: ResourceNode | null = null;
  private ai!: AiState;
  private matchResult: MatchResult = 'ongoing';
  private matchElapsedMs = 0;
  private animTimeMs = 0;
  private enemyBuildingLastSeen = new Map<number, number>();
  private fogAccMs = 999;
  private viewCull: ViewBounds | null = null;
  private playerSkinAccent = 0xf0c75e;
  private lastSelectTap = { t: 0, unitId: -1, sx: 0, sy: 0 };

  constructor() {
    super('KaneBattlefield');
  }

  create(data?: {
    species?: SpeciesId;
    difficulty?: AiDifficultyId;
    mapId?: string;
  }): void {
    this.input.mouse?.disableContextMenu();

    const playerSpecies: SpeciesId =
      data?.species === 'nobles' || data?.species === 'weirdos'
        ? data.species
        : 'brutes';
    const difficulty = getAiDifficulty(data?.difficulty).id;
    this.playerSkinAccent = getEquippedSkin(playerSpecies).accent;

    const { layer } = createSkirmishMap(this, data?.mapId);
    this.world = createBattlefieldWorld(playerSpecies, difficulty, data?.mapId);
    this.placeables = placeableBuildings(playerSpecies);
    this.placeIndex = 0;
    this.placeType = this.placeables[0] ?? 'bonker_hut';
    this.ai = createAiState(difficulty);
    this.matchResult = 'ongoing';
    this.paused = false;
    this.matchElapsedMs = 0;
    this.cameraCtl = new RtsCamera(this);
    const first = this.world.units.find((u) => u.team === 'player');
    if (first) this.cameras.main.centerOn(first.x + 80, first.y - 40);

    this.boxGfx = this.add.graphics().setDepth(50);
    this.unitGfx = this.add.graphics().setDepth(10);

    this.ghostGfx = this.add.graphics().setDepth(40);
    this.amoveReticleGfx = this.add.graphics().setDepth(45);
    this.amoveTintGfx = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(90);
    this.underAttackGfx = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(88);
    this.fogOverlay = new FogOverlay(this);
    tickFog(this.world, this.world.fog);
    this.fogOverlay.refresh(this.world.fog);

    this.hud = new BattlefieldHud(this, this.world);
    this.hud.hidePhaserStock();
    resetMatchStock();
    mountStockStrip();
    layoutStockStrip(this.scale.width, this.scale.height);
    this.hud.menuBtn.on('pointerup', () => this.scene.start('GamePicker'));
    this.hud.onArmAttackMove = () => this.toggleAttackMoveMode();
    this.hud.onStopSelected = () => this.issueStopCommand();
    this.hud.onRecenterBase = () => this.recenterOnPlayerBase();
    this.hud.onPause = () => this.togglePause();
    this.hud.onHelp = () => this.toggleControlsHelp();
    this.hud.onSelectArmy = () => this.clearBuildingSelection();
    this.hud.onIdleWorkers = (result) => {
      this.clearBuildingSelection();
      if (result.focus) {
        this.cameraCtl.centerOn(result.focus.x, result.focus.y);
      }
    };
    this.hud.onIdleMilitary = (result) => {
      this.clearBuildingSelection();
      if (result.focus) {
        this.cameraCtl.centerOn(result.focus.x, result.focus.y);
      }
    };
    this.hud.onUnderAttackJump = (x, y) => {
      this.cameraCtl.centerOn(x, y);
    };
    this.controlsHelp = createControlsHelpPanel({
      getSpeciesId: () => this.world.speciesId,
    });
    mountSelectionPanel({
      stop: () => this.issueStopCommand(),
      attackMove: () => this.toggleAttackMoveMode(),
      rally: () => this.toggleRallyMode(),
      clearRally: () => {
        const b = this.selectedBuilding;
        if (!b || b.team !== 'player' || !buildingCanRally(b)) return;
        clearBuildingRally(b);
        recordPlayerAction(this.world);
        this.clearRallyMode();
        playSfx('ui');
      },
      cancelQueue: (index) => {
        const b = this.selectedBuilding;
        if (!b || b.team !== 'player') return;
        const refunded = cancelQueuedTrain(this.world, b, index);
        if (refunded) {
          recordPlayerAction(this.world);
          playSfx('ui');
          flashQueueCancel({
            unitName: refunded.unitName,
            gold: refunded.gold,
            crystals: refunded.crystals,
          });
        } else {
          playSfx('ui');
        }
      },
      train: (typeId) => {
        const b = this.selectedBuilding;
        if (!b || b.team !== 'player') return;
        if (queueTrain(this.world, b, typeId)) playSfx('train');
        else playSfx('ui');
      },
      placeBuilding: (typeId) => this.armPlacementFromPanel(typeId),
      castAbility: (slot) => {
        if (castHeroAbility(this.world, slot, 'player')) playSfx('ability');
        else playSfx('ui');
      },
      toggleFormation: () => {
        if (this.paused || this.matchResult !== 'ongoing') return;
        if (this.world.speciesId !== 'nobles') {
          playSfx('ui');
          return;
        }
        toggleFormationSelected(this.world);
        playSfx('ui');
      },
      toggleRage: () => {
        if (this.paused || this.matchResult !== 'ongoing') return;
        if (this.world.speciesId !== 'brutes') {
          playSfx('ui');
          return;
        }
        toggleRageSelected(this.world);
        playSfx('ui');
      },
      toggleMutation: () => {
        if (this.paused || this.matchResult !== 'ongoing') return;
        if (this.world.speciesId !== 'weirdos') {
          playSfx('ui');
          return;
        }
        toggleMutationSelected(this.world);
        playSfx('ui');
      },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unmountSelectionPanel();
      this.controlsHelp.destroy();
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      unmountSelectionPanel();
      this.controlsHelp.destroy();
    });
    this.pauseMenu = new PauseMenu({
      scene: this,
      onResume: () => this.setPaused(false),
      onRematch: () => this.rematchSameSkirmish(),
      onQuit: () => this.scene.start('GamePicker'),
      ignoreOnMain: (objs) => {
        this.cameras.main.ignore(objs);
      },
    });
    this.minimap = new Minimap(this, this.world, this.cameraCtl);
    this.tutorial = createTutorialState();
    if (isCoachSeen()) {
      this.tutorial.visible = false;
      this.tutorial.step = 'done';
    }
    this.coach = new TutorialCoach(
      this,
      this.tutorial,
      () => this.world.mapId,
      () => this.world.aiDifficulty,
    );
    this.coreBanner = new CoreVictoryBanner(this, this.world);
    this.splitHudCamera([
      layer,
      this.boxGfx,
      this.unitGfx,
      this.ghostGfx,
      this.amoveReticleGfx,
      this.fogOverlay.gfx,
    ]);
    this.groupBadges = new ControlGroupBadgeLayer(this, this.hudCam);
    this.rallyDistLabel = new RallyDistanceLabel(this, this.hudCam);
    this.ghostAgeLabels = new BuildingGhostAgeLabels(this, this.hudCam);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.groupBadges.destroy();
      this.rallyDistLabel.destroy();
      this.ghostAgeLabels.destroy();
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.groupBadges.destroy();
      this.rallyDistLabel.destroy();
      this.ghostAgeLabels.destroy();
    });
    const onResize = (): void => {
      this.hud.layout();
      layoutStockStrip(this.scale.width, this.scale.height);
      this.coach.layout();
      this.coreBanner.layout();
      this.minimap.layout();
      this.hudCam.setSize(this.scale.width, this.scale.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off('resize', onResize),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearGameplayBlur();
      unmountStockStrip();
      resetMatchStock();
    });

    this.shiftKey =
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT) ?? null;
    this.ctrlKey =
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL) ?? null;
    this.altKey =
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ALT) ?? null;
    this.controlGroups = createControlGroups();
    this.groupTaps.reset();
    this.subgroupCycle = null;
    this.touchOrderPress = null;

    this.bindInput();
    ensureAmbientBgm();
    this.input.once('pointerdown', () => ensureAmbientBgm());
    if (flags.adsEnabled) {
      console.warn(`[${BRAND.name}] ads should stay off`);
    }
  }

  private splitHudCamera(world: Phaser.GameObjects.GameObject[]): void {
    this.cameras.main.ignore(this.children.list.filter((o) => !world.includes(o)));
    this.hudCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.hudCam.ignore(world);
  }

  private bindInput(): void {
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.keyboard?.on('keydown-ESC', () => this.onEscapeKey());
    this.input.keyboard?.on('keydown-PAUSE', () => this.togglePause());
    this.input.keyboard?.on('keydown-B', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      if (this.mode === 'place' && this.placeables.length > 1) {
        this.placeIndex = (this.placeIndex + 1) % this.placeables.length;
        this.placeType = this.placeables[this.placeIndex]!;
        this.refreshPlacementGhost();
        return;
      }
      if (this.mode === 'attackMove') this.clearAttackMoveMode();
      this.clearRallyMode();
      this.mode = this.mode === 'place' ? 'none' : 'place';
      if (this.mode === 'place' && this.placeables.length) {
        this.placeType = this.placeables[this.placeIndex]!;
        const mid = this.cameras.main.midPoint;
        this.updateGhostAt(mid.x, mid.y);
      }
      if (this.mode !== 'place') this.ghostGfx.clear();
    });
    this.input.keyboard?.on('keydown-F', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.world.speciesId === 'nobles') {
        toggleFormationSelected(this.world);
        flashStanceHotkey('formation');
        playSfx('ui');
      }
    });
    this.input.keyboard?.on('keydown-M', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.world.speciesId === 'weirdos') {
        toggleMutationSelected(this.world);
        flashStanceHotkey('mutation');
        playSfx('ui');
      }
    });
    this.input.keyboard?.on('keydown-R', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.world.speciesId === 'brutes') {
        toggleRageSelected(this.world);
        flashStanceHotkey('rage');
        playSfx('ui');
      }
    });
    this.input.keyboard?.on('keydown-H', () => {
      if (this.matchResult !== 'ongoing') return;
      this.toggleControlsHelp();
    });
    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      if (this.matchResult !== 'ongoing') return;
      if (ev.key === '?' || ev.key === '/') {
        ev.preventDefault();
        this.toggleControlsHelp();
      }
    });
    this.input.keyboard?.on('keydown-Q', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      if (castHeroAbility(this.world, 'ability1', 'player')) playSfx('ability');
    });
    this.input.keyboard?.on('keydown-W', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      if (castHeroAbility(this.world, 'ability2', 'player')) playSfx('ability');
    });
    this.input.keyboard?.on('keydown-E', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      if (castHeroAbility(this.world, 'ultimate', 'player')) playSfx('ability');
    });
    this.input.keyboard?.on('keydown-S', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      this.issueStopCommand();
    });
    this.input.keyboard?.on('keydown-A', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      if (this.ctrlHeld()) {
        this.selectAllMilitary();
        return;
      }
      this.toggleAttackMoveMode();
    });
    this.input.keyboard?.on('keydown-HOME', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      this.recenterOnPlayerBase();
    });

    const digitEvents = [
      'ZERO',
      'ONE',
      'TWO',
      'THREE',
      'FOUR',
      'FIVE',
      'SIX',
      'SEVEN',
      'EIGHT',
      'NINE',
    ] as const;
    digitEvents.forEach((name, slot) => {
      this.input.keyboard?.on(`keydown-${name}`, (e: KeyboardEvent) =>
        this.onDigitHotkey(slot, e.timeStamp, e.repeat),
      );
    });

    const onTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      if (!e.repeat) this.cycleSubgroup(e.shiftKey ? -1 : 1);
    };
    window.addEventListener('keydown', onTab);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      window.removeEventListener('keydown', onTab),
    );
  }

  private cycleSubgroup(dir: 1 | -1): void {
    const step = stepSubgroup(this.world, this.subgroupCycle, dir);
    if (!step) {
      playSfx('ui');
      return;
    }
    this.subgroupCycle = step.cycle;
    this.clearBuildingSelection();
    const wanted = new Set(step.ids);
    for (const u of this.world.units) u.selected = wanted.has(u.id);
    playSfx('select');
  }

  private onEscapeKey(): void {
    if (this.matchResult !== 'ongoing') return;
    if (this.controlsHelp.isOpen()) {
      this.controlsHelp.hide();
      return;
    }
    if (this.paused) {
      this.setPaused(false);
      return;
    }
    if (
      this.mode === 'place' ||
      this.mode === 'attackMove' ||
      this.mode === 'rally'
    ) {
      this.clearAttackMoveMode();
      this.clearRallyMode();
      this.mode = 'none';
      this.ghostGfx.clear();
      return;
    }
    this.setPaused(true);
  }

  private toggleControlsHelp(): void {
    if (this.matchResult !== 'ongoing') return;
    if (this.paused) return;
    this.controlsHelp.toggle();
  }

  private togglePause(): void {
    if (this.matchResult !== 'ongoing') return;
    this.setPaused(!this.paused);
  }

  private pauseSnapshot() {
    const cam = this.cameras.main;
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    const matchPrefs = loadMatchPrefs();
    return {
      elapsedMs: this.matchElapsedMs,
      supplyCurrent: livingByTeam(this.world, 'player'),
      supplyCap: flags.unitCap,
      mapId: this.world.mapId,
      difficulty: this.world.aiDifficulty,
      speciesId: this.world.speciesId,
      objectiveId: resolveMissionObjective(this.world.aiDifficulty),
      camSector: minimapCameraSectorAt(
        cam.scrollX,
        cam.scrollY,
        viewW,
        viewH,
      ),
      fogAgeMs:
        this.world.lastFogRevealAgeMs != null
          ? this.world.lastFogRevealAgeMs
          : undefined,
      fogCoveragePct: fogExploredCoveragePct(this.world.fog),
      selectionCount: this.world.units.filter(
        (u) => u.selected && u.team === 'player' && u.hp > 0,
      ).length,
      selectedSector:
        pauseSelectedSectorAt(
          this.world.units.filter(
            (u) => u.selected && u.team === 'player' && u.hp > 0,
          ),
        ) ?? undefined,
      stockGold: walletOf(this.world, 'player').gold,
      stockCrystals: walletOf(this.world, 'player').magic_crystals,
      playerActions: this.world.playerActions,
      armyCount: this.world.units.filter((u) => isMilitaryUnit(u)).length,
      buildingCount: this.world.buildings.filter(
        (b) => b.team === 'player' && b.hp > 0,
      ).length,
      idleWorkerCount: countIdleWorkers(this.world),
      heroStatus: minimapHeroStatus(this.world),
      winStreak: matchPrefs.winStreak ?? 0,
      lossStreak: matchPrefs.lossStreak ?? 0,
      bestWinStreak: Math.max(
        matchPrefs.bestWinStreak ?? 0,
        matchPrefs.winStreak ?? 0,
      ),
      gamesPlayed: matchPrefs.gamesPlayed ?? 0,
      gamesWon: matchPrefs.gamesWon ?? 0,
      avgDurationMs: matchPrefs.avgDurationMs,
      avgApm: matchPrefs.avgApm,
      bestApm: matchPrefs.bestApm,
      favoriteFactionId: favoriteFactionId(),
    };
  }

  private setPaused(value: boolean): void {
    if (this.matchResult !== 'ongoing') return;
    if (value === this.paused) {
      if (value && !this.pauseMenu.isOpen) {
        this.pauseMenu.show(this.pauseSnapshot());
        this.setGameplayBlur(true);
      }
      return;
    }
    this.paused = value;
    if (value) {
      this.clearAttackMoveMode();
      this.touchOrderPress = null;
      this.mode = 'none';
      this.ghostGfx.clear();
      this.boxGfx.clear();
      this.cameraCtl.suppressPan = true;
      this.pauseMenu.show(this.pauseSnapshot());
      this.setGameplayBlur(true);
      playSfx('ui');
    } else {
      this.pauseMenu.hide();
      this.setGameplayBlur(false);
      this.cameraCtl.suppressPan = false;
      this.hud.syncMuteLabel();
      playSfx('ui');
    }
  }

  private setGameplayBlur(on: boolean): void {
    if (on) {
      if (this.pauseBlur) return;
      this.pauseBlur = this.cameras.main.filters.internal.addBlur(
        0,
        2,
        2,
        1,
        0xffffff,
        4,
      );
      return;
    }
    this.clearGameplayBlur();
  }

  private clearGameplayBlur(): void {
    if (!this.pauseBlur) return;
    this.cameras.main.filters.internal.remove(this.pauseBlur);
    this.pauseBlur = null;
  }

  private onDigitHotkey(slot: number, now: number, repeat: boolean): void {
    if (this.paused || this.matchResult !== 'ongoing') return;
    const countKey = shouldCountGroupHotkey(repeat);
    if (this.ctrlHeld() || this.altHeld()) {
      this.groupTaps.reset();
      const save = this.shiftHeld() ? addToControlGroup : assignControlGroup;
      if (countKey && save(this.world, this.controlGroups, slot)) {
        spawnControlGroupAssignFx(this.world, slot);
        this.hud.flashControlGroup(slot, 'assign');
        playSfx('select');
      }
      return;
    }
    if (
      this.selectedBuilding &&
      slot >= 1 &&
      slot <= 3 &&
      trainHotkey(this.world, this.selectedBuilding, slot - 1)
    ) {
      this.groupTaps.reset();
      playSfx('train');
      return;
    }
    if (!countKey) return;
    this.clearBuildingSelection();
    if (
      recallControlGroup(
        this.world,
        this.controlGroups,
        slot,
        this.shiftHeld(),
      ) > 0
    ) {
      spawnControlGroupRecallFx(this.world, slot);
      this.hud.flashControlGroup(slot, 'recall');
      playSfx('select');
      if (this.groupTaps.press(slot, now)) {
        const center = groupCenter(this.world, this.controlGroups.get(slot) ?? []);
        if (center) this.cameraCtl.centerOn(center.x, center.y);
      }
    } else {
      this.groupTaps.reset();
    }
  }

  private clearBuildingSelection(): void {
    for (const b of this.world.buildings) b.selected = false;
    this.selectedBuilding = null;
    this.selectedNode = null;
    this.clearRallyMode();
  }

  private toggleRallyMode(): void {
    if (this.mode === 'rally') {
      this.clearRallyMode();
      playSfx('ui');
      return;
    }
    const b = this.selectedBuilding;
    if (!b || b.team !== 'player' || !buildingCanRally(b)) {
      playSfx('ui');
      return;
    }
    if (this.mode === 'place') this.ghostGfx.clear();
    this.clearAttackMoveMode();
    this.mode = 'rally';
    playSfx('ui');
  }

  private clearRallyMode(): void {
    if (this.mode === 'rally') this.mode = 'none';
  }

  private shiftHeld(): boolean {
    return !!this.shiftKey?.isDown;
  }

  private ctrlHeld(): boolean {
    return !!this.ctrlKey?.isDown;
  }

  private altHeld(): boolean {
    return !!this.altKey?.isDown;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.matchResult !== 'ongoing' || this.paused) return;
    if (pointer.y < 40 && pointer.x > this.scale.width - 80) return;

    this.pointerStart = { x: pointer.x, y: pointer.y };
    const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
    this.worldStart = { x: wp.x, y: wp.y };
    this.cameraStart = { ...this.cameraCtl.scroll };

    if (this.mode === 'attackMove' && pointer.leftButtonDown()) {
      if (issueAttackMoveSelected(this.world, wp.x, wp.y) > 0) playSfx('attack');
      this.clearAttackMoveMode();
      return;
    }

    if (this.mode === 'rally' && pointer.leftButtonDown()) {
      const b = this.selectedBuilding;
      if (b && b.team === 'player' && buildingCanRally(b)) {
        setBuildingRally(b, wp.x, wp.y);
        recordPlayerAction(this.world);
        playSfx('ui');
      }
      this.clearRallyMode();
      return;
    }

    if (this.mode === 'place' && pointer.leftButtonDown()) {
      if (this.ghostValid) {
        const placed = placeBuilding(
          this.world,
          'player',
          this.placeType,
          this.ghostPos.x,
          this.ghostPos.y,
        );
        if (placed) {
          playSfx('build');
          this.mode = 'none';
          this.ghostGfx.clear();
        }
      }
      return;
    }

    if (pointer.middleButtonDown()) {
      this.mode = 'pan';
      return;
    }
    if (pointer.rightButtonDown()) {
      this.issuePointerOrder(wp.x, wp.y);
      return;
    }
    this.mode = 'select';
    this.cameraCtl.suppressPan = true;
    if (pointer.wasTouch) {
      this.touchOrderPress = {
        pointerId: pointer.pointerId,
        sx: pointer.x,
        sy: pointer.y,
        wx: wp.x,
        wy: wp.y,
        at: this.time.now,
      };
    }
  }

  private issuePointerOrder(worldX: number, worldY: number): void {
    if (
      this.mode === 'place' ||
      this.mode === 'attackMove' ||
      this.mode === 'rally'
    ) {
      this.clearAttackMoveMode();
      this.clearRallyMode();
      this.mode = 'none';
      this.ghostGfx.clear();
      return;
    }
    const enemy = findEnemyAt(this.world, worldX, worldY, 'player');
    const node = findNodeAt(this.world, worldX, worldY);
    if (enemy) {
      issueAttackSelected(this.world, enemy);
      playSfx('attack');
    } else if (node) {
      issueGatherSelected(this.world, node);
      playSfx('gather');
    } else issueMoveSelected(this.world, worldX, worldY);
    this.mode = 'none';
    this.boxGfx.clear();
    this.cameraCtl.suppressPan = false;
  }

  private noteTouchOrderMove(pointer: Phaser.Input.Pointer): void {
    const press = this.touchOrderPress;
    if (!press || pointer.pointerId !== press.pointerId) return;
    const moved = Math.hypot(pointer.x - press.sx, pointer.y - press.sy);
    if (touchLongPressAction(0, moved) === 'cancel' || this.mode === 'box') {
      this.touchOrderPress = null;
    }
  }

  private pollTouchOrder(): void {
    const press = this.touchOrderPress;
    if (!press) return;
    if (this.paused || this.matchResult !== 'ongoing' || this.mode === 'box') {
      this.touchOrderPress = null;
      return;
    }
    let pointer: Phaser.Input.Pointer | null = null;
    for (const candidate of this.input.manager.pointers) {
      if (candidate.pointerId === press.pointerId && candidate.isDown) {
        pointer = candidate;
        break;
      }
    }
    if (!pointer) return;
    const moved = Math.hypot(pointer.x - press.sx, pointer.y - press.sy);
    const action = touchLongPressAction(this.time.now - press.at, moved);
    if (action === 'cancel') {
      this.touchOrderPress = null;
      return;
    }
    if (action !== 'order') return;
    this.touchOrderPress = null;
    this.issuePointerOrder(press.wx, press.wy);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (this.paused) return;
    const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
    if (this.mode === 'attackMove') {
      this.amovePointer = { x: wp.x, y: wp.y };
      this.drawAttackMoveFeedback();
      return;
    }
    if (this.mode === 'place') {
      this.updateGhostAt(wp.x, wp.y);
      return;
    }

    if (this.mode === 'none') return;
    const dx = pointer.x - this.pointerStart.x;
    const dy = pointer.y - this.pointerStart.y;

    if (this.mode === 'pan') {
      this.cameraCtl.setScroll(
        this.cameraStart.x - dx / this.cameraCtl.zoom,
        this.cameraStart.y - dy / this.cameraCtl.zoom,
      );
      return;
    }

    if (this.mode === 'select' && Math.hypot(dx, dy) > 8) {
      this.mode = 'box';
    }
    this.noteTouchOrderMove(pointer);

    if (this.mode === 'box') {
      this.boxGfx.clear();
      this.boxGfx.lineStyle(2, 0xf0c75e, 0.95);
      this.boxGfx.fillStyle(0xf0c75e, 0.12);
      const x = Math.min(this.worldStart.x, wp.x);
      const y = Math.min(this.worldStart.y, wp.y);
      const w = Math.abs(wp.x - this.worldStart.x);
      const h = Math.abs(wp.y - this.worldStart.y);
      this.boxGfx.strokeRect(x, y, w, h);
      this.boxGfx.fillRect(x, y, w, h);
    }
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (
      this.touchOrderPress &&
      pointer.pointerId === this.touchOrderPress.pointerId
    ) {
      this.touchOrderPress = null;
    }
    if (this.paused) return;
    this.cameraCtl.suppressPan = false;
    if (this.mode === 'place' || this.mode === 'pan') {
      if (this.mode === 'pan') this.mode = 'none';
      return;
    }
    const additive = this.shiftHeld();
    if (this.mode === 'box') {
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      this.clearBuildingSelection();
      selectInRect(
        this.world,
        this.worldStart.x,
        this.worldStart.y,
        wp.x,
        wp.y,
        additive,
      );
      if (selectedCount(this.world) > 0) playSfx('select');
      this.boxGfx.clear();
      this.mode = 'none';
      return;
    }
    if (this.mode === 'select' && pointer.leftButtonReleased()) {
      const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
      const b = findBuildingAt(this.world, wp.x, wp.y, 'player');
      if (b && !additive) {
        clearSelection(this.world);
        this.clearBuildingSelection();
        b.selected = true;
        this.selectedBuilding = b;
        this.lastSelectTap.t = 0;
        playSfx('select');
      } else {
        this.clearBuildingSelection();
        const hit = findPlayerUnitAt(this.world, wp.x, wp.y);
        if (
          hit &&
          selectsWholeType({
            additive,
            ctrlKey: pointer.event.ctrlKey,
            metaKey: pointer.event.metaKey,
            doubleTap: this.isDoubleSelectTap(pointer, hit.id),
          })
        ) {
          const n = selectAllVisibleSameType(this.world, hit.typeId);
          if (n > 0) playSfx('select');
          this.lastSelectTap.t = 0;
        } else if (hit) {
          if (selectAt(this.world, wp.x, wp.y, additive)) playSfx('select');
          if (!additive) {
            this.lastSelectTap = {
              t: this.time.now,
              unitId: hit.id,
              sx: pointer.x,
              sy: pointer.y,
            };
          } else {
            this.lastSelectTap.t = 0;
          }
        } else {
          const node = findNodeAt(this.world, wp.x, wp.y);
          if (node && !additive && isExplored(this.world.fog, node.x, node.y)) {
            clearSelection(this.world);
            this.selectedNode = node;
            playSfx('select');
            this.lastSelectTap.t = 0;
          } else {
            if (selectAt(this.world, wp.x, wp.y, additive)) playSfx('select');
            this.lastSelectTap.t = 0;
          }
        }
      }
    }
    this.mode = 'none';
  }

  private isDoubleSelectTap(
    pointer: Phaser.Input.Pointer,
    unitId: number,
  ): boolean {
    const DOUBLE_MS = 380;
    const DOUBLE_PX = 36;
    const prev = this.lastSelectTap;
    if (prev.unitId !== unitId) return false;
    if (this.time.now - prev.t > DOUBLE_MS) return false;
    return Math.hypot(pointer.x - prev.sx, pointer.y - prev.sy) <= DOUBLE_PX;
  }

  private updateGhostAt(worldX: number, worldY: number): void {
    const def = getBuildingType(this.placeType);
    const snapped = snapBuildingWorld(worldX, worldY, def.radius);
    this.ghostPos = snapped;
    this.ghostValid = !buildingBlocks(
      this.world,
      snapped.x,
      snapped.y,
      def.radius,
    );
    this.refreshPlacementGhost();
  }

  private armPlacementFromPanel(typeId: BuildingTypeId): void {
    if (this.paused || this.matchResult !== 'ongoing') return;
    if (this.controlsHelp.isOpen()) return;
    if (!this.placeables.includes(typeId)) {
      playSfx('ui');
      return;
    }
    if (this.mode === 'place' && this.placeType === typeId) {
      this.mode = 'none';
      this.ghostGfx.clear();
      playSfx('ui');
      return;
    }
    if (this.mode === 'attackMove') this.clearAttackMoveMode();
    this.clearRallyMode();
    this.placeType = typeId;
    const idx = this.placeables.indexOf(typeId);
    this.placeIndex = idx >= 0 ? idx : 0;
    this.mode = 'place';
    const mid = this.cameras.main.midPoint;
    this.updateGhostAt(mid.x, mid.y);
    playSfx('ui');
  }

  private refreshPlacementGhost(): void {
    if (this.mode !== 'place') {
      this.ghostGfx.clear();
      return;
    }
    const def = getBuildingType(this.placeType);
    const affordable = canAfford(walletOf(this.world, 'player'), def.cost);
    this.ghostGfx.clear();
    drawPlacementGhost(this.ghostGfx, {
      x: this.ghostPos.x,
      y: this.ghostPos.y,
      typeId: this.placeType,
      valid: this.ghostValid,
      affordable,
      timeMs: this.animTimeMs,
      accent: this.playerSkinAccent,
    });
  }

  private issueStopCommand(): void {
    const n = stopSelected(this.world);
    if (n <= 0) return;
    spawnStopPulses(this.world);
    this.hud.flashStopButton();
    playSfx('ui');
  }

  private recenterOnPlayerBase(): void {
    const pt = findPlayerBasePoint(this.world);
    if (!pt) return;
    this.cameraCtl.centerOn(pt.x, pt.y);
    playSfx('ui');
  }

  private selectAllMilitary(): void {
    this.clearBuildingSelection();
    this.hud.pickArmy();
  }

  private toggleAttackMoveMode(): void {
    if (this.mode === 'attackMove') {
      this.clearAttackMoveMode();
      playSfx('ui');
      return;
    }
    if (selectedCount(this.world) <= 0) {
      playSfx('ui');
      return;
    }
    if (this.mode === 'place') this.ghostGfx.clear();
    this.clearRallyMode();
    this.mode = 'attackMove';
    const mid = this.cameras.main.midPoint;
    this.amovePointer = { x: mid.x, y: mid.y };
    this.hud.setAttackMoveArmed(true);
    setAttackMoveCursor(this.game.canvas, true);
    this.drawAttackMoveFeedback();
    playSfx('ui');
  }

  private clearAttackMoveMode(): void {
    if (this.mode === 'attackMove') this.mode = 'none';
    this.hud.setAttackMoveArmed(false);
    setAttackMoveCursor(this.game.canvas, false);
    this.amoveTintGfx.clear();
    this.amoveReticleGfx.clear();
  }

  private drawAttackMoveFeedback(): void {
    if (this.mode !== 'attackMove') return;
    drawAttackMoveScreenTint(
      this.amoveTintGfx,
      this.scale.width,
      this.scale.height,
      this.animTimeMs,
    );
    drawAttackMoveReticle(
      this.amoveReticleGfx,
      this.amovePointer.x,
      this.amovePointer.y,
      this.animTimeMs,
    );
  }

  private drawUnderAttackFeedback(): void {
    const alert = this.world.underAttackAlert;
    if (!alert || alert.lifeMs <= 0) {
      this.underAttackGfx.clear();
      return;
    }
    drawUnderAttackEdgeFlash(
      this.underAttackGfx,
      this.scale.width,
      this.scale.height,
      alert.lifeMs,
      alert.maxLifeMs,
      alert.severity === 'critical',
    );
  }

  update(_t: number, delta: number): void {
    this.pollTouchOrder();
    if (!this.paused) {
      this.animTimeMs += delta;
      this.cameraCtl.update(delta);
    }
    if (this.matchResult === 'ongoing' && !this.paused) {
      this.matchElapsedMs += delta;
      tickBattlefield(this.world, delta);
      tickBattlefieldEconomy(this.world);
      for (const fx of this.world.economyFx) {
        if (fx.lifeMs >= fx.maxLifeMs - delta) playSfx(fx.sfx);
      }
      tickEconomyFx(this.world, delta);
      tickStopFx(this.world, delta);
      tickControlGroupFx(this.world, delta);
      tickWaypointMarkers(this.world, delta);
      tickBuildings(this.world, delta);
      tickProduction(this.world, delta);
      tickFormations(this.world, delta);
      tickMutations(this.world, delta);
      tickRage(this.world, delta);
      tickHeroes(this.world, delta);
      tickBattlefieldAi(this.world, this.ai, delta);
      this.fogAccMs += delta;
      if (this.fogAccMs >= MOBILE_PERF.fogMs) {
        this.fogAccMs = 0;
        tickFog(this.world, this.world.fog);
        if (this.world.fog.exploredDirty) {
          spawnScoutPulsesFromFog(this.world, this.world.fog);
        }
      }
      tickScoutPulses(this.world, delta);
      tickAttentionPings(this.world, delta);
      tickCoreFragments(this.world, delta);
      tickBattlefieldCombat(this.world, delta);
      if (this.world.units.some((u) => u.lastAttackFlashMs > 100)) {
        playSfx('attack');
      }
      if (this.world.coreClaimFlashMs > 180) {
        playSfx('ability');
      }
      const alert = this.world.underAttackAlert;
      if (alert?.pulse) {
        alert.pulse = false;
        playSfx('alert');
        if (!isReduceMotion()) {
          const critical = alert.severity === 'critical';
          this.cameraCtl.softNudgeToward(
            alert.x,
            alert.y,
            critical ? 0.38 : 0.22,
          );
        }
      }
      tickTutorial(this.world, this.tutorial, delta);
      const result = evaluateMatch(this.world);
      if (result !== 'ongoing') this.showEndScreen(result);
    }
    if (
      this.selectedBuilding &&
      !this.world.buildings.includes(this.selectedBuilding)
    ) {
      this.selectedBuilding = null;
    }
    if (this.selectedNode && this.selectedNode.remaining <= 0) {
      this.selectedNode = null;
    }
    const cam = this.cameras.main;
    this.viewCull = viewBoundsFromCamera(
      cam.scrollX,
      cam.scrollY,
      cam.width / cam.zoom,
      cam.height / cam.zoom,
    );
    this.drawWorld();
    if (this.mode === 'place') this.refreshPlacementGhost();
    if (this.mode === 'attackMove') this.drawAttackMoveFeedback();
    if (this.paused || this.matchResult !== 'ongoing') {
      this.underAttackGfx.clear();
    } else {
      this.drawUnderAttackFeedback();
    }
    this.fogOverlay.refresh(this.world.fog, cam);
    if (this.matchResult === 'ongoing') {
      this.refreshHud(delta);
      this.coach.refresh();
      this.coreBanner.refresh(delta);
      this.minimap.refresh(delta, this.selectedBuilding, this.matchElapsedMs);
    }
  }

  private showEndScreen(result: MatchResult): void {
    if (this.matchResult !== 'ongoing') return;
    if (result === 'ongoing') return;
    this.matchResult = result;
    if (this.paused) {
      this.paused = false;
      this.pauseMenu.hide();
      this.setGameplayBlur(false);
    }
    this.clearAttackMoveMode();
    this.ghostGfx.clear();
    unmountSelectionPanel();
    unmountStockStrip();
    this.hud.setBottomInset(0);
    this.minimap.setBottomInset(0);
    this.coreBanner.hide();
    for (const obj of this.children.list) {
      const depth = (obj as { depth?: number }).depth ?? 0;
      if (depth < 200 && 'setVisible' in obj) {
        (obj as { setVisible: (v: boolean) => void }).setVisible(false);
      }
    }
    this.cameraCtl.suppressPan = true;
    this.writeEndMatchSummary(result);

    const playerUnitsLeft = livingByTeam(this.world, 'player');
    const playerBuildingsLeft = this.world.buildings.filter(
      (b) => b.team === 'player' && b.hp > 0,
    ).length;

    showKaneEndScreen({
      scene: this,
      win: result === 'victory',
      speciesId: this.world.speciesId,
      mapId: this.world.mapId,
      durationMs: Math.max(0, Math.floor(this.matchElapsedMs)),
      playerUnitsLeft,
      playerBuildingsLeft,
      playerUnitKills: this.world.playerUnitKills,
      playerUnitLosses: this.world.playerUnitLosses,
      playerUnitsTrained: this.world.playerUnitsTrained,
      playerBuildingsRaised: this.world.playerBuildingsRaised,
      playerBuildingsLost: this.world.playerBuildingsLost,
      playerGoldGathered: this.world.playerGoldGathered,
      playerCrystalsGathered: this.world.playerCrystalsGathered,
      playerActions: this.world.playerActions,
      playerVisionTiles: maxPlayerVisionTiles(this.world),
      reason: matchEndReason(this.world, result),
      onMenu: () => this.scene.start('GamePicker'),
      onRematch: () => this.rematchSameSkirmish(),
      difficulty: this.world.aiDifficulty,
      onStepUp: (() => {
        const won = result === 'victory';
        const next =
          nextDifficultyAfterWin(won, this.world.aiDifficulty) ??
          previousDifficultyAfterLoss(won, this.world.aiDifficulty);
        return next ? () => this.stepUpDifficulty(next) : undefined;
      })(),
      onTryMap: (() => {
        const speciesNext = nextSpeciesAfterCatalog(
          result === 'victory',
          this.world.aiDifficulty,
          this.world.mapId,
          this.world.speciesId,
        );
        if (speciesNext) return undefined;
        const next = nextMapAfterHardWin(
          result === 'victory',
          this.world.aiDifficulty,
          this.world.mapId,
        );
        return next ? () => this.stepUpMap(next) : undefined;
      })(),
      onTrySpecies: (() => {
        const next = nextSpeciesAfterCatalog(
          result === 'victory',
          this.world.aiDifficulty,
          this.world.mapId,
          this.world.speciesId,
        );
        return next ? () => this.stepUpSpecies(next.species, next.mapId) : undefined;
      })(),
      ignoreOnMain: (objs) => {
        this.cameras.main.ignore(objs);
      },
    });
  }

  private stepUpDifficulty(difficulty: AiDifficultyId): void {
    const { species, mapId } = rematchPrefsFromWorld(this.world);
    rememberMatchPrefs(species, difficulty, mapId);
    recordGameStarted(species);
    void maybeRecordCloudGameStarted(species);
    this.scene.start('KaneBattlefield', { species, difficulty, mapId });
  }

  private stepUpSpecies(species: SpeciesId, mapId: SkirmishMapId): void {
    rememberMatchPrefs(species, 'hard', mapId);
    recordGameStarted(species);
    void maybeRecordCloudGameStarted(species);
    this.scene.start('KaneBattlefield', {
      species,
      difficulty: 'hard',
      mapId,
    });
  }

  private stepUpMap(mapId: SkirmishMapId): void {
    const { species, difficulty } = rematchPrefsFromWorld(this.world);
    rememberMatchPrefs(species, difficulty, mapId);
    recordGameStarted(species);
    void maybeRecordCloudGameStarted(species);
    this.scene.start('KaneBattlefield', { species, difficulty, mapId });
  }

  private rematchSameSkirmish(): void {
    const { species, difficulty, mapId } = rematchPrefsFromWorld(this.world);
    rememberMatchPrefs(species, difficulty, mapId);
    recordGameStarted(species);
    void maybeRecordCloudGameStarted(species);
    this.scene.start('KaneBattlefield', { species, difficulty, mapId });
  }

  private writeEndMatchSummary(result: Exclude<MatchResult, 'ongoing'>): void {
    const endedAtMs = Date.now();
    const id = makeMatchSummaryId(endedAtMs);
    const playerUnitsLeft = livingByTeam(this.world, 'player');
    const enemyUnitsLeft = livingByTeam(this.world, 'enemy');
    const playerBuildingsLeft = this.world.buildings.filter(
      (b) => b.team === 'player' && b.hp > 0,
    ).length;
    const enemyBuildingsLeft = this.world.buildings.filter(
      (b) => b.team === 'enemy' && b.hp > 0,
    ).length;
    const durationMs = Math.max(0, Math.floor(this.matchElapsedMs));
    const won = result === 'victory';
    const species = this.world.speciesId;
    const difficulty = this.world.aiDifficulty;
    rememberMatchPrefs(
      species,
      difficulty,
      this.world.mapId,
      durationMs,
      won,
      this.world.playerActions,
    );
    void writeMatchSummaryFunctionStub({
      id,
      version: 1,
      endedAtMs,
      durationMs,
      result,
      won,
      species,
      difficulty,
      playerUnitsLeft,
      enemyUnitsLeft,
      playerBuildingsLeft,
      enemyBuildingsLeft,
    });
    void maybeWriteCloudMatch({
      id,
      endedAtMs,
      durationMs,
      result,
      won,
      species,
      difficulty,
      playerUnitsLeft,
      enemyUnitsLeft,
      playerBuildingsLeft,
      enemyBuildingsLeft,
    });
  }

  private refreshHud(dtMs = 16): void {
    this.hud.setMatchTimer(this.matchElapsedMs);
    const n = selectedCount(this.world);
    const sel = selectedUnits(this.world);
    const friends = livingByTeam(this.world, 'player');
    const foes = livingByTeam(this.world, 'enemy');
    const b = this.selectedBuilding;
    const node =
      n > 0 || b ? null : this.selectedNode;

    const selView = buildSelectionView(
      this.world,
      b,
      sel,
      this.mode === 'attackMove',
      this.mode === 'rally',
      node,
      this.mode === 'place' ? this.placeType : null,
    );
    const panelOpen = renderSelectionPanel(
      selView.kind === 'empty' && this.scale.height < 500
        ? { kind: 'hidden' }
        : selView,
    );
    const inset = selectionPanelInsetPx(
      panelOpen,
      selView.kind === 'empty',
    );
    this.hud.setBottomInset(inset);
    this.minimap.setBottomInset(inset);

    let status: string;
    if (this.mode === 'rally' && b) {
      status = t('hud.rallyStatus', { name: buildingDisplayName(b.typeId) });
    } else if (b) {
      const hall = getBuildingType(b.typeId).isMainHall;
      status = hall
        ? t('hud.buildingBuild', { name: buildingDisplayName(b.typeId) })
        : t('hud.buildingSelected', { name: buildingDisplayName(b.typeId) });
    } else if (node) {
      const remaining = Math.floor(node.remaining);
      status =
        node.resourceId === 'magic_crystals'
          ? t('hud.nodeCrystals', { n: remaining })
          : t('hud.nodeGold', { n: remaining });
    } else if (n === 0) {
      status = t('hud.alive', { friends, foes });
    } else if (n === 1) {
      status = t('hud.unitSelected', { name: unitDisplayName(sel[0]!.typeId) });
    } else {
      status = t('hud.manySelected', { n });
    }

    const placing = this.mode === 'place';
    const def = placing ? getBuildingType(this.placeType) : null;
    if (placing && def) {
      const gold = def.cost.gold ?? 0;
      const crystals = def.cost.magic_crystals ?? 0;
      const canPay = canAfford(walletOf(this.world, 'player'), def.cost);
      const foot = placementFootprintSize(this.placeType);
      const buildSec =
        def.buildMs > 0 ? Math.max(0, Math.ceil(def.buildMs / 1000)) : 0;
      this.hud.setPlacementCost({
        name: buildingDisplayName(def.id),
        gold,
        crystals,
        canPay,
        cols: foot.cols,
        rows: foot.rows,
        buildSec,
      });
    } else {
      this.hud.setPlacementCost(null);
    }
    const hint = this.hud.controlHint(
      placing,
      def ? buildingDisplayName(def.id) : undefined,
      def?.cost.gold ?? 0,
      this.mode === 'attackMove',
      def?.cost.magic_crystals ?? 0,
    );
    this.hud.refresh(status, hint, dtMs);
    const wallet = walletOf(this.world, 'player');
    publishMatchStock({
      gold: wallet.gold,
      crystals: wallet.magic_crystals,
      supply: livingByTeam(this.world, 'player'),
      supplyCap: flags.unitCap,
      nowMs: this.matchElapsedMs,
    });
  }

  private drawWorld(): void {
    const g = this.unitGfx;
    g.clear();
    const view = this.viewCull;

    drawHeroAbilityVfxList(g, this.world.vfx, view);
    drawEconomyFxList(g, this.world.economyFx, view);
    drawStopFxList(g, this.world.stopFx, view);
    drawControlGroupFxList(g, this.world.controlGroupFx, view);
    drawScoutPulseList(g, this.world.scoutPulses, view);
    drawAttentionPingList(g, this.world.attentionPings, view);
    drawWaypointMarkers(
      g,
      this.world.waypointMarkers,
      this.animTimeMs,
      view,
    );
    drawBuildingRallyMarkers(
      g,
      this.world.buildings,
      this.selectedBuilding,
      this.animTimeMs,
      view,
    );
    drawCoreFragments(g, this.world, this.animTimeMs, view);
    drawCombatFxList(g, this.world.combatFx, view);
    drawFormationVisuals(g, this.world, this.animTimeMs);
    drawMutationVisuals(g, this.world, this.animTimeMs);
    drawRageVisuals(g, this.world, this.animTimeMs);

    const livingBuildingIds = new Set<number>();
    for (const b of this.world.buildings) {
      livingBuildingIds.add(b.id);
      if (view && !inView(view, b.x, b.y)) continue;
      if (b.team === 'enemy') {
        const revealed = enemyRevealed(this.world.fog, b.x, b.y);
        if (revealed) {
          noteEnemyBuildingVisible(
            this.enemyBuildingLastSeen,
            b.id,
            this.animTimeMs,
          );
        } else {
          const ghostA = enemyBuildingGhostAlpha(
            this.enemyBuildingLastSeen,
            b.id,
            this.animTimeMs,
          );
          if (ghostA <= 0.02) continue;
          drawBuildingSilhouette(g, {
            x: b.x,
            y: b.y,
            radius: b.radius,
            color: b.color,
            accent: b.accent,
            typeId: b.typeId,
            alpha: ghostA,
            selected: false,
            timeMs: this.animTimeMs,
          });
          continue;
        }
      }
      const alpha = b.complete ? 1 : 0.45 + 0.4 * b.buildProgress;
      drawBuildingSilhouette(g, {
        x: b.x,
        y: b.y,
        radius: b.radius,
        color: b.color,
        accent: b.team === 'player' ? this.playerSkinAccent : b.accent,
        typeId: b.typeId,
        alpha,
        selected: !!b.selected,
        timeMs: this.animTimeMs,
      });
      drawProductionQueueFeedback(g, b, this.animTimeMs);
      if (!b.complete) {
        const bw = b.radius * 2;
        g.fillStyle(0x222222, 0.8);
        g.fillRect(b.x - b.radius, b.y + b.radius + 4, bw, 5);
        g.fillStyle(0xf0c75e, 1);
        g.fillRect(b.x - b.radius, b.y + b.radius + 4, bw * b.buildProgress, 5);
      }
      const barW = b.radius * 2;
      const pct = Math.max(0, b.hp / b.maxHp);
      g.fillStyle(0x333333, 1);
      g.fillRect(b.x - b.radius, b.y - b.radius - 10, barW, 4);
      g.fillStyle(0x5dce6a, 1);
      g.fillRect(b.x - b.radius, b.y - b.radius - 10, barW * pct, 4);
    }
    pruneBuildingGhosts(this.enemyBuildingLastSeen, livingBuildingIds);

    for (const s of this.world.stockpiles) {
      if (view && !inView(view, s.x, s.y)) continue;
      if (s.team === 'enemy' && !enemyRevealed(this.world.fog, s.x, s.y)) {
        continue;
      }
      g.lineStyle(1, s.team === 'player' ? 0xf0c75e : 0xc4a0e0, 0.35);
      g.strokeCircle(s.x, s.y, s.radius);
    }

    for (const n of this.world.nodes) {
      if (n.remaining <= 0) continue;
      if (view && !inView(view, n.x, n.y)) continue;
      if (!isExplored(this.world.fog, n.x, n.y)) continue;
      const inspected = this.selectedNode?.id === n.id;
      if (inspected) {
        g.lineStyle(2.5, n.resourceId === 'magic_crystals' ? 0x7ec8ff : 0xf0c75e, 0.95);
        g.strokeCircle(n.x, n.y, n.radius + 8);
      }
      drawResourceNodeSilhouette(g, {
        x: n.x,
        y: n.y,
        radius: n.radius,
        resourceId: n.resourceId,
        remainingPct: n.remaining / n.maxAmount,
      });
    }

    for (const u of this.world.units) {
      if (view && !inView(view, u.x, u.y)) continue;
      if (u.team === 'enemy' && !enemyRevealed(this.world.fog, u.x, u.y)) {
        continue;
      }
      if (u.selected) {
        g.lineStyle(1, 0xf0c75e, 0.35);
        g.strokeCircle(u.x, u.y, u.range);
        g.lineStyle(2, 0xf0c75e, 1);
        g.strokeCircle(u.x, u.y, u.radius + 6);
      }
      const flash = u.lastAttackFlashMs > 0;
      drawUnitSilhouette(g, {
        x: u.x,
        y: u.y,
        radius: u.radius,
        fill: u.color,
        speciesId: u.speciesId,
        typeId: u.typeId,
        timeMs: this.animTimeMs,
        seed: u.id,
        phase: resolveUnitAnimPhase(u),
        flash,
        mutated: u.mutated,
        inFormation: u.inFormation,
        skinAccent:
          u.team === 'player' ? this.playerSkinAccent : undefined,
      });
      g.fillStyle(
        u.team === 'player' ? this.playerSkinAccent : 0xe8a0ff,
        0.95,
      );
      g.fillCircle(u.x, u.y - u.radius * 0.35, 3.2);

      if (u.carrying > 0 && u.carryingResource) {
        g.fillStyle(RESOURCES[u.carryingResource].color, 1);
        g.fillCircle(u.x + 8, u.y - 8, 5);
      }

      const barW = 28;
      const barH = 4;
      const bx = u.x - barW / 2;
      const by = u.y - u.radius - 12;
      const pct = Math.max(0, u.hp / u.maxHp);
      g.fillStyle(0x1a1a1a, 0.75);
      g.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
      g.fillStyle(0x333333, 1);
      g.fillRect(bx, by, barW, barH);
      g.fillStyle(pct > 0.35 ? 0x5dce6a : 0xe85a5a, 1);
      g.fillRect(bx, by, barW * pct, barH);

      if (u.moveTarget && !u.attackTargetId) {
        g.lineStyle(1, 0xf0c75e, 0.45);
        let px = u.x;
        let py = u.y;
        g.lineBetween(px, py, u.moveTarget.x, u.moveTarget.y);
        px = u.moveTarget.x;
        py = u.moveTarget.y;
        for (const wp of u.path) {
          g.lineBetween(px, py, wp.x, wp.y);
          px = wp.x;
          py = wp.y;
        }
      }
      if (u.attackTargetId != null) {
        const t =
          this.world.units.find((o) => o.id === u.attackTargetId) ??
          this.world.buildings.find((o) => o.id === u.attackTargetId);
        if (t) {
          g.lineStyle(1, 0xe85a5a, 0.55);
          g.lineBetween(u.x, u.y, t.x, t.y);
        }
      }
    }

    drawGatherTargetHighlights(g, this.world, this.animTimeMs, view);
    this.groupBadges.sync(this.world, this.controlGroups, view);
    this.rallyDistLabel.sync(this.selectedBuilding, view);
    this.ghostAgeLabels.sync(
      this.world,
      this.enemyBuildingLastSeen,
      this.animTimeMs,
      view,
    );
  }
}