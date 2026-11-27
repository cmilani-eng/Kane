/**
 * Kane Battlefield Scene — main gameplay for Kane game.
 * Based on src/presentation/scenes/BattlefieldScene.ts with Kane-specific navigation.
 * Navigation: Menu -> GamePicker, Rematch -> KaneBattlefield
 *
 * Called by: src/games/kane/index.ts (exports for registry)
 * Replaces: src/presentation/scenes/BattlefieldScene.ts (for Kane-specific battlefield)
 * Reads: Same data as original BattlefieldScene
 */
import { SIM_STEP_MS, stepBattlefieldSim } from "../../gameplay/battlefield/battlefieldSimStep";
import { applyDueCommands, createCommandSchedule, type BattleCommand, type StanceId } from "../../gameplay/battlefield/battlefieldCommands";
import { battlefieldHash } from "../../gameplay/battlefield/battlefieldHash";
import { createLockstep, type Lockstep } from "../../networking/lockstep";
import { createMatchChannel } from "../../networking/matchChannel";
import { getMatchDatabase } from "../../networking/matchDatabase";
import { announcePresence, watchPresence, type PeerPresence } from "../../networking/matchPresence";
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
import { createAiState, type AiState } from '../../gameplay/battlefield/battlefieldAi';
import { toggleFormationSelected } from '../../gameplay/battlefield/battlefieldFormations';
import { castHeroAbility, recruitHero } from '../../gameplay/battlefield/battlefieldHeroes';
import type { HeroAbilitySlot } from '../../data/heroes';
import { toggleMutationSelected } from '../../gameplay/battlefield/battlefieldMutations';
import { toggleRageSelected } from '../../gameplay/battlefield/battlefieldRage';
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
import { buildingBlocks, canAfford, findBuildingAt, placeBuilding, snapBuildingWorld } from '../../gameplay/battlefield/battlefieldBuildings';
import { findEnemyAt, issueAttackSelected, livingByTeam } from '../../gameplay/battlefield/battlefieldCombat';
import { findNodeAt, issueGatherSelected, walletOf } from '../../gameplay/battlefield/battlefieldEconomy';
import { cancelQueuedTrain, queueTrain, trainHotkey } from '../../gameplay/battlefield/battlefieldProduction';
import {
  evaluateMatch,
  resultForTeam,
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
import { spawnControlGroupAssignFx, spawnControlGroupRecallFx } from '../../gameplay/battlefield/battlefieldControlGroupFx';
import { spawnStopPulses } from '../../gameplay/battlefield/battlefieldStopFx';
import { findPlayerBasePoint } from '../../gameplay/battlefield/playerBase';
import { clearSelection, createBattlefieldWorld, findUnitAtForTeam, issueMoveSelected, recordPlayerAction, selectAllVisibleSameType, selectAt, selectInRect, selectedCount, selectedUnits, type BattlefieldBuilding, type BattlefieldWorld, type ResourceNode } from '../../gameplay/battlefield/battlefieldWorld';
import {
  enemyRevealed,
  isExplored,
  tickFog,
} from '../../gameplay/battlefield/battlefieldFog';
import {
  makeMatchSummaryId,
} from '../../database/matchSummary';
import { getEquippedSkin } from '../../database/cosmeticsLoadout';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { favoriteFactionId } from '../../presentation/ui/lobbyFavoriteFactionTip';
import { lobbySpeciesPlaysCount } from '../../presentation/ui/lobbySpeciesPlaysTip';
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
import { showEndCard } from '../../presentation/ui/endCard';
import { resolveMissionObjective } from '../../presentation/ui/missionObjective';
import { minimapCameraSectorAt } from '../../presentation/ui/minimapCameraSectorTip';
import { fogExploredCoveragePct } from '../../presentation/ui/minimapFogCoverageTip';
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
import { inView, viewBoundsFromCamera, type ViewBounds } from '../../presentation/perf/mobileBudget';

type PointerMode =
  | 'none'
  | 'select'
  | 'box'
  | 'pan'
  | 'place'
  | 'attackMove'
  | 'rally';

/** Most sim steps run in one frame; past this the backlog is dropped (see update). */
const MAX_SIM_STEPS_PER_FRAME = 8;
/** Ticks between state hashes that the two players compare. */
const HASH_EVERY_TICKS = 30;

/** A two-player match, as the lobby hands it to the battle scene. */
export interface PvpMatch {
  code: string;
  role: 'host' | 'guest';
  uid: string;
  peerUid: string;
  seed: number;
  hostSpecies: SpeciesId;
  guestSpecies: SpeciesId;
}

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
  private simAccMs = 0;
  /** The side this player controls: 'player' in single-player and for the host, 'enemy' for the guest. */
  private me: 'player' | 'enemy' = 'player';
  private pvp = false;
  private lockstep: Lockstep | null = null;
  private schedule = createCommandSchedule();
  private simTick = 0;
  private outOfSync = false;
  private waitText: Phaser.GameObjects.Text | null = null;
  /** Two-player: the friend's presence, whether they have been seen yet, and whether they are gone. */
  private peerPresence: PeerPresence = 'missing';
  private peerSeen = false;
  private peerLeft = false;
  /** Two-player: true while the last step could not run because the friend's orders are missing. */
  private waitingNow = false;
  private stopPresence: (() => void) | null = null;
  private stopPeerWatch: (() => void) | null = null;
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
    pvp?: PvpMatch;
  }): void {
    this.input.mouse?.disableContextMenu();

    const playerSpecies: SpeciesId =
      data?.species === 'nobles' || data?.species === 'weirdos'
        ? data.species
        : 'brutes';
    const difficulty = getAiDifficulty(data?.difficulty).id;
    this.playerSkinAccent = getEquippedSkin(playerSpecies).accent;

    const { layer } = createSkirmishMap(this, data?.mapId);
    // Picked here, not in the simulation, so each match differs and clients can share the seed.
    const matchSeed = Math.floor(Math.random() * 0x100000000);
    this.pvp = data?.pvp !== undefined;
    this.me = data?.pvp?.role === 'guest' ? 'enemy' : 'player';
    this.world = data?.pvp
      ? createBattlefieldWorld(data.pvp.hostSpecies, difficulty, data.mapId, data.pvp.seed, data.pvp.guestSpecies)
      : createBattlefieldWorld(playerSpecies, difficulty, data?.mapId, matchSeed);
    this.world.controlTeam = this.me;
    if (data?.pvp) this.startLockstep(data.pvp);
    this.placeables = placeableBuildings(playerSpecies);
    this.placeIndex = 0;
    this.placeType = this.placeables[0] ?? 'bonker_hut';
    this.ai = createAiState(difficulty);
    this.matchResult = 'ongoing';
    this.paused = false;
    this.matchElapsedMs = 0;
    this.cameraCtl = new RtsCamera(this);
    const first = this.world.units.find((u) => u.team === this.me);
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
    this.hud.onHeroAbility = (slot) => (slot === 'recruit' ? this.useRecruit() : this.useHeroAbility(slot));
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
        if (!b || b.team !== this.me || !buildingCanRally(b)) return;
        clearBuildingRally(b);
        recordPlayerAction(this.world);
        this.clearRallyMode();
        playSfx('ui');
      },
      cancelQueue: (index) => {
        const b = this.selectedBuilding;
        if (!b || b.team !== this.me) return;
        if (this.pvp) {
          this.lockstep?.issue(this.simTick, { team: this.me, unitIds: [], kind: 'cancelTrain', buildingId: b.id, index });
          playSfx('ui');
          return;
        }
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
        if (!b || b.team !== this.me) return;
        if (this.pvp) {
          this.lockstep?.issue(this.simTick, { team: this.me, unitIds: [], kind: 'train', buildingId: b.id, typeId });
          playSfx('train');
          return;
        }
        if (queueTrain(this.world, b, typeId)) playSfx('train');
        else playSfx('ui');
      },
      placeBuilding: (typeId) => this.armPlacementFromPanel(typeId),
      castAbility: (slot) => this.useHeroAbility(slot),
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
      if (this.viewerSpecies() === 'nobles') {
        this.toggleStance('formation');
        flashStanceHotkey('formation');
        playSfx('ui');
      }
    });
    this.input.keyboard?.on('keydown-M', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.viewerSpecies() === 'weirdos') {
        this.toggleStance('mutation');
        flashStanceHotkey('mutation');
        playSfx('ui');
      }
    });
    this.input.keyboard?.on('keydown-R', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.viewerSpecies() === 'brutes') {
        this.toggleStance('rage');
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
      this.useHeroAbility('ability1');
    });
    this.input.keyboard?.on('keydown-W', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      this.useHeroAbility('ability2');
    });
    this.input.keyboard?.on('keydown-E', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.controlsHelp.isOpen()) return;
      this.useHeroAbility('ultimate');
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
      supplyCurrent: livingByTeam(this.world, this.me),
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
        (u) => u.selected && u.team === this.me && u.hp > 0,
      ).length,
      selectedSector:
        pauseSelectedSectorAt(
          this.world.units.filter(
            (u) => u.selected && u.team === this.me && u.hp > 0,
          ),
        ) ?? undefined,
      stockGold: walletOf(this.world, this.me).gold,
      stockCrystals: walletOf(this.world, this.me).magic_crystals,
      playerActions: this.world.playerActions,
      armyCount: this.world.units.filter((u) => isMilitaryUnit(u)).length,
      buildingCount: this.world.buildings.filter(
        (b) => b.team === this.me && b.hp > 0,
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
      bestDurationMapId: matchPrefs.bestDurationMapId,
      avgApm: matchPrefs.avgApm,
      bestApm: matchPrefs.bestApm,
      favoriteFactionId: favoriteFactionId(),
      speciesPlays: lobbySpeciesPlaysCount() ?? 0,
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
    // Production building still uses 1–3 to train when selected.
    if (this.selectedBuilding && slot >= 1 && slot <= 3) {
      const b = this.selectedBuilding;
      if (this.pvp) {
        const typeId = b.team === this.me && b.complete ? getBuildingType(b.typeId).trains[slot - 1] : undefined;
        if (typeId) {
          this.lockstep?.issue(this.simTick, { team: this.me, unitIds: [], kind: 'train', buildingId: b.id, typeId });
          this.groupTaps.reset();
          playSfx('train');
          return;
        }
      } else if (trainHotkey(this.world, b, slot - 1)) {
        this.groupTaps.reset();
        playSfx('train');
        return;
      }
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
    if (this.pvp) return;
    if (this.mode === 'rally') {
      this.clearRallyMode();
      playSfx('ui');
      return;
    }
    const b = this.selectedBuilding;
    if (!b || b.team !== this.me || !buildingCanRally(b)) {
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
      if (b && b.team === this.me && buildingCanRally(b)) {
        setBuildingRally(b, wp.x, wp.y);
        recordPlayerAction(this.world);
        playSfx('ui');
      }
      this.clearRallyMode();
      return;
    }

    if (this.mode === 'place' && pointer.leftButtonDown()) {
      if (this.ghostValid) {
        // In a two-player match the building goes through the shared tick, so both sides place it.
        if (this.pvp) {
          this.lockstep?.issue(this.simTick, {
            team: this.me,
            unitIds: [],
            kind: 'place',
            buildingType: this.placeType,
            x: this.ghostPos.x,
            y: this.ghostPos.y,
          });
          playSfx('build');
          this.mode = 'none';
          this.ghostGfx.clear();
          return;
        }
        const placed = placeBuilding(
          this.world,
          this.me,
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

  /** Right-click, and a touch long-press, share this move / attack / gather path. */
  /**
   * Two-player: an attack on an enemy, a gather on a resource, or otherwise a move. The
   * order goes to the friend and runs on a shared tick, so both sides apply the same one.
   */
  private issueFriendOrder(worldX: number, worldY: number): void {
    if (!this.lockstep) return;
    const unitIds = this.world.units
      .filter((u) => u.selected && u.team === this.me && u.hp > 0)
      .map((u) => u.id);
    if (unitIds.length === 0) return;
    const enemy = findEnemyAt(this.world, worldX, worldY, this.me);
    const node = findNodeAt(this.world, worldX, worldY);
    const command: BattleCommand = enemy
      ? { team: this.me, unitIds, kind: 'attack', targetId: enemy.id }
      : node
        ? { team: this.me, unitIds, kind: 'gather', nodeId: node.id }
        : { team: this.me, unitIds, kind: 'move', x: worldX, y: worldY };
    this.lockstep.issue(this.simTick, command);
  }

  /** The species this viewer plays: the host's in the host's battle, the friend's in the friend's. */
  private viewerSpecies(): string {
    return this.pvp && this.me === 'enemy' ? this.world.enemySpeciesId : this.world.speciesId;
  }

  /** Locks or unlocks a stance on the selected units. In a two-player match it runs on the shared tick. */
  private toggleStance(stance: StanceId): void {
    if (this.pvp) {
      if (!this.lockstep) return;
      const unitIds = this.world.units
        .filter((u) => u.selected && u.team === this.me && u.hp > 0)
        .map((u) => u.id);
      if (unitIds.length === 0) return;
      this.lockstep.issue(this.simTick, { team: this.me, unitIds, kind: 'stance', stance });
      return;
    }
    if (stance === 'rage') toggleRageSelected(this.world);
    else if (stance === 'formation') toggleFormationSelected(this.world);
    else toggleMutationSelected(this.world);
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
    if (this.pvp) {
      this.issueFriendOrder(worldX, worldY);
      this.mode = 'none';
      this.boxGfx.clear();
      this.cameraCtl.suppressPan = false;
      return;
    }
    const enemy = findEnemyAt(this.world, worldX, worldY, this.me);
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
      const b = findBuildingAt(this.world, wp.x, wp.y, this.me);
      if (b && !additive) {
        clearSelection(this.world);
        this.clearBuildingSelection();
        b.selected = true;
        this.selectedBuilding = b;
        this.lastSelectTap.t = 0;
        playSfx('select');
      } else {
        this.clearBuildingSelection();
        const hit = findUnitAtForTeam(this.world, wp.x, wp.y, this.me);
        // Ctrl/Cmd+click picks every unit of the type at once (macOS reports
        // Ctrl+click as a right-click, so Cmd+click is the Mac route).
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
    const affordable = canAfford(walletOf(this.world, this.me), def.cost);
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

  /** S / Stop — halt selection and flash halt rings. */
  /** A hero ability. In a two-player match it runs on the shared tick, so both sides cast it. */
  private useHeroAbility(slot: HeroAbilitySlot): void {
    if (this.pvp) {
      this.lockstep?.issue(this.simTick, { team: this.me, unitIds: [], kind: 'ability', slot });
      playSfx('ability');
      return;
    }
    if (castHeroAbility(this.world, slot, this.me)) playSfx('ability');
    else playSfx('ui');
  }

  /** Recruits this viewer's hero. In a two-player match it runs on the shared tick. */
  private useRecruit(): void {
    if (this.pvp) {
      this.lockstep?.issue(this.simTick, { team: this.me, unitIds: [], kind: 'recruit' });
      playSfx('hero');
      return;
    }
    if (recruitHero(this.world, this.me)) playSfx('hero');
  }

  private issueStopCommand(): void {
    if (this.pvp) {
      const unitIds = this.world.units
        .filter((u) => u.selected && u.team === this.me && u.hp > 0)
        .map((u) => u.id);
      if (unitIds.length === 0) return;
      this.lockstep?.issue(this.simTick, { team: this.me, unitIds, kind: 'stop' });
      this.hud.flashStopButton();
      playSfx('ui');
      return;
    }
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
    if (this.pvp) return;
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

  /** Two-player: connects this match to the friend. Without a database there is no match. */
  private startLockstep(pvp: PvpMatch): void {
    this.world.pvp = true;
    const db = getMatchDatabase();
    if (db) {
      this.lockstep = createLockstep(createMatchChannel(db, pvp.code, pvp.uid, pvp.peerUid));
      this.stopPresence = announcePresence(db, pvp.code, pvp.uid);
      this.stopPeerWatch = watchPresence(db, pvp.code, pvp.peerUid, (presence) => this.onPeerPresence(presence));
    }
    this.waitText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.18, t('pvp.waiting'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#f0c75e',
        backgroundColor: '#0a1220cc',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(95)
      .setVisible(false);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.lockstep?.stop();
      this.stopPeerWatch?.();
      this.stopPresence?.();
    });
  }

  /** Two-player: the friend's presence changed. Stepping pauses while they are gone and resumes if they return. */
  private onPeerPresence(presence: PeerPresence): void {
    if (presence !== 'missing') this.peerSeen = true;
    this.peerPresence = presence;
    this.peerLeft = this.peerSeen && presence === 'missing';
    this.refreshWaitText();
  }

  /** Two-player: says why the battle is not moving, or that the friend has left. */
  private refreshWaitText(): void {
    if (!this.waitText || this.outOfSync) return;
    let message: string | null = null;
    if (this.matchResult === 'ongoing' && this.peerLeft) {
      message = t('pvp.peerLeft');
    } else if (this.waitingNow) {
      if (!this.peerSeen) message = t('pvp.waitingJoin');
      else if (this.peerPresence === 'away') message = t('pvp.peerAway');
      else message = t('pvp.waiting');
    }
    this.waitText.setText(message ?? '').setVisible(message !== null);
  }

  /** Two-player: runs a fixed step only once the friend's orders for it have arrived. */
  private stepLockstep(delta: number): void {
    const lockstep = this.lockstep;
    if (!lockstep || this.outOfSync) return;
    this.simAccMs += delta;
    let waiting = false;
    for (let steps = 0; !this.peerLeft && this.simAccMs >= SIM_STEP_MS && steps < MAX_SIM_STEPS_PER_FRAME; steps++) {
      if (!lockstep.canRun(this.simTick)) {
        waiting = true;
        break;
      }
      for (const command of lockstep.beginTick(this.simTick)) this.schedule.add(this.simTick, command);
      applyDueCommands(this.world, this.schedule, this.simTick);
      stepBattlefieldSim(this.world, this.ai);
      if (this.simTick % HASH_EVERY_TICKS === 0) lockstep.recordHash(this.simTick, battlefieldHash(this.world));
      this.simTick++;
      this.simAccMs -= SIM_STEP_MS;
    }
    if (this.simAccMs >= SIM_STEP_MS) this.simAccMs = 0;
    this.waitingNow = waiting || this.peerLeft;
    this.refreshWaitText();
    if (lockstep.desyncTick() !== null) {
      this.outOfSync = true;
      this.waitText?.setText(t('pvp.outOfSync')).setVisible(true);
    }
  }

  update(_t: number, delta: number): void {
    this.pollTouchOrder();
    if (!this.paused) {
      this.animTimeMs += delta;
      this.cameraCtl.update(delta);
    }
    if (this.matchResult === 'ongoing' && !this.paused) {
      this.matchElapsedMs += delta;
      // Mute-aware gather/deposit SFX — fire once while FX is fresh.
      for (const fx of this.world.economyFx) {
        if (fx.lifeMs >= fx.maxLifeMs - delta) playSfx(fx.sfx);
      }
      // The simulation runs in fixed steps, never on the frame delta, so clients stay in sync.
      if (this.pvp) {
        this.stepLockstep(delta);
      } else {
      this.simAccMs += delta;
      for (
        let steps = 0;
        this.simAccMs >= SIM_STEP_MS && steps < MAX_SIM_STEPS_PER_FRAME;
        steps++
      ) {
        stepBattlefieldSim(this.world, this.ai);
        this.simAccMs -= SIM_STEP_MS;
      }
      // After a stall (background tab, long pause) drop the backlog rather than racing to catch up.
      if (this.simAccMs >= SIM_STEP_MS) this.simAccMs = 0;
      }
      // Attack flash just set (~120) — one SFX per frame max.
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
      const result = resultForTeam(evaluateMatch(this.world), this.me);
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

    const playerUnitsLeft = livingByTeam(this.world, this.me);
    const playerBuildingsLeft = this.world.buildings.filter(
      (b) => b.team === this.me && b.hp > 0,
    ).length;

    showEndCard({
      win: result === 'victory',
      speciesId: this.world.speciesId,
      mapId: this.world.mapId,
      durationMs: Math.max(0, Math.floor(this.matchElapsedMs)),
      playerUnitsLeft,
      playerBuildingsLeft,
      playerUnitKills: this.world.playerUnitKills,
      playerUnitLosses: this.world.playerUnitLosses,
      playerUnitsTrained: this.world.playerUnitsTrained,
      playerBuildingsLost: this.world.playerBuildingsLost,
      playerGoldGathered: this.world.playerGoldGathered,
      playerCrystalsGathered: this.world.playerCrystalsGathered,
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
    const playerUnitsLeft = livingByTeam(this.world, this.me);
    const enemyUnitsLeft = livingByTeam(this.world, 'enemy');
    const playerBuildingsLeft = this.world.buildings.filter(
      (b) => b.team === this.me && b.hp > 0,
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
    const friends = livingByTeam(this.world, this.me);
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
      const canPay = canAfford(walletOf(this.world, this.me), def.cost);
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
    const wallet = walletOf(this.world, this.me);
    publishMatchStock({
      gold: wallet.gold,
      crystals: wallet.magic_crystals,
      supply: livingByTeam(this.world, this.me),
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
        accent: b.team === this.me ? this.playerSkinAccent : b.accent,
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
      g.lineStyle(1, s.team === this.me ? 0xf0c75e : 0xc4a0e0, 0.35);
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
          u.team === this.me ? this.playerSkinAccent : undefined,
      });
      g.fillStyle(
        u.team === this.me ? this.playerSkinAccent : 0xe8a0ff,
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