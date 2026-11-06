/**
 * Battlefield — select/move/combat + economy (gather Gold / Magic Crystals).
 * Phaser 4 APIs: https://docs.phaser.io/
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import { RESOURCES } from '../../data/resources';
import {
  getBuildingType,
  placeableBuildings,
  type BuildingTypeId,
} from '../../data/buildings';
import { type SpeciesId } from '../../data/speciesStub';
import {
  getAiDifficulty,
  type AiDifficultyId,
} from '../../gameplay/battlefield/aiDifficulty';
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
import { BattlefieldHud } from '../ui/battlefieldHud';
import { Minimap } from '../ui/minimap';
import {
  buildSelectionView,
  mountSelectionPanel,
  renderSelectionPanel,
  selectionPanelInsetPx,
  unmountSelectionPanel,
} from '../ui/selectionPanel';
import { TutorialCoach } from '../ui/tutorialCoach';
import {
  createTutorialState,
  tickTutorial,
  type TutorialState,
} from '../../gameplay/battlefield/battlefieldTutorial';
import {
  buildingBlocks,
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
  type MatchResult,
} from '../../gameplay/battlefield/battlefieldVictory';
import {
  assignControlGroup,
  createControlGroups,
  issueAttackMoveSelected,
  recallControlGroup,
  stopSelected,
  type ControlGroups,
} from '../../gameplay/battlefield/battlefieldOrders';
import {
  groupCenter,
  GroupTapTracker,
} from '../../gameplay/battlefield/battlefieldGroupFocus';
import { selectsWholeType } from '../../gameplay/battlefield/battlefieldSelectClick';
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
  selectAllVisibleSameType,
  selectAt,
  selectInRect,
  selectedCount,
  selectedUnits,
  tickBattlefield,
  type BattlefieldBuilding,
  type BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import {
  enemyRevealed,
  isExplored,
  tickFog,
} from '../../gameplay/battlefield/battlefieldFog';
import {
  spawnScoutPulsesFromFog,
  tickScoutPulses,
} from '../../gameplay/battlefield/battlefieldScoutPulse';
import {
  makeMatchSummaryId,
} from '../../database/matchSummary';
import { getEquippedSkin } from '../../database/cosmeticsLoadout';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { recordGameStarted } from '../../database/localStats';
import { writeMatchSummaryFunctionStub } from '../../server/matchSummaryFunctionStub';
import {
  maybeRecordCloudGameStarted,
  maybeWriteCloudMatch,
} from '../../firebase/cloudProgression';
import { ensureAmbientBgm } from '../audio/bgm';
import { playSfx } from '../audio/sfx';
import { RtsCamera } from '../camera/rtsCamera';
import { createSkirmishMap } from '../maps/mapManager';
import { FogOverlay } from '../ui/fogOverlay';
import { showKaneEndScreen } from '../ui/endScreen';
import { PauseMenu } from '../ui/pauseMenu';
import {
  createControlsHelpPanel,
  type ControlsHelpHandle,
} from '../ui/controlsHelpPanel';
import { drawBuildingSilhouette } from '../buildings/buildingSilhouette';
import { drawPlacementGhost } from '../buildings/placementGhost';
import { drawProductionQueueFeedback } from '../buildings/productionQueueFeedback';
import { drawResourceNodeSilhouette } from '../resources/resourceNodeSilhouette';
import { drawCombatFxList } from '../fx/combatFxDraw';
import { drawCoreFragments } from '../fx/coreFragmentDraw';
import { drawEconomyFxList } from '../fx/economyFxDraw';
import { drawFormationVisuals } from '../fx/formationVisual';
import {
  drawAttackMoveReticle,
  drawAttackMoveScreenTint,
  setAttackMoveCursor,
} from '../fx/attackMoveFeedback';
import { drawUnderAttackEdgeFlash } from '../fx/underAttackAlert';
import { drawHeroAbilityVfxList } from '../fx/heroAbilityVfx';
import { drawMutationVisuals } from '../fx/mutationVisual';
import { drawRageVisuals } from '../fx/rageVisual';
import { drawControlGroupFxList } from '../fx/controlGroupFeedback';
import { drawStopFxList } from '../fx/stopCommandFeedback';
import { drawWaypointMarkers } from '../fx/waypointMarkersDraw';
import { drawBuildingRallyMarkers } from '../fx/rallyMarkerDraw';
import { drawScoutPulseList } from '../fx/scoutPulseDraw';
import {
  buildingCanRally,
  setBuildingRally,
} from '../../gameplay/battlefield/battlefieldRally';
import {
  drawUnitSilhouette,
  resolveUnitAnimPhase,
} from '../units/unitSilhouette';
import {
  inView,
  MOBILE_PERF,
  viewBoundsFromCamera,
  type ViewBounds,
} from '../perf/mobileBudget';

type PointerMode =
  | 'none'
  | 'select'
  | 'box'
  | 'pan'
  | 'place'
  | 'attackMove'
  | 'rally';

export class BattlefieldScene extends Phaser.Scene {
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
  private controlsHelp!: ControlsHelpHandle;
  private paused = false;
  private minimap!: Minimap;
  private tutorial!: TutorialState;
  private coach!: TutorialCoach;
  private shiftKey: Phaser.Input.Keyboard.Key | null = null;
  private ctrlKey: Phaser.Input.Keyboard.Key | null = null;
  private altKey: Phaser.Input.Keyboard.Key | null = null;
  private controlGroups!: ControlGroups;
  /** Spots a double-tap on a group key, which centres the camera. */
  private groupTaps = new GroupTapTracker();
  private placeables: BuildingTypeId[] = [];
  private placeIndex = 0;
  private placeType: BuildingTypeId = 'bonker_hut';
  private ghostPos = { x: 0, y: 0 };
  private ghostValid = false;
  private selectedBuilding: BattlefieldBuilding | null = null;
  private ai!: AiState;
  private matchResult: MatchResult = 'ongoing';
  /** Active match time only — does not advance while paused. */
  private matchElapsedMs = 0;
  private animTimeMs = 0;
  private fogAccMs = 999;
  private viewCull: ViewBounds | null = null;
  /** Equipped cosmetics accent for the player species (visual only). */
  private playerSkinAccent = 0xf0c75e;
  /** Double-click / double-tap tracking for same-type select. */
  private lastSelectTap = { t: 0, unitId: -1, sx: 0, sy: 0 };

  constructor() {
    super('Battlefield');
  }

  create(data?: { species?: SpeciesId; difficulty?: AiDifficultyId }): void {
    this.input.mouse?.disableContextMenu();

    const playerSpecies: SpeciesId =
      data?.species === 'nobles' || data?.species === 'weirdos'
        ? data.species
        : 'brutes';
    const difficulty = getAiDifficulty(data?.difficulty).id;
    this.playerSkinAccent = getEquippedSkin(playerSpecies).accent;

    const { layer } = createSkirmishMap(this);
    this.world = createBattlefieldWorld(playerSpecies, difficulty);
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
    this.hud.menuBtn.on('pointerup', () => this.scene.start('Menu'));
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
    this.controlsHelp = createControlsHelpPanel({});
    mountSelectionPanel({
      stop: () => this.issueStopCommand(),
      attackMove: () => this.toggleAttackMoveMode(),
      rally: () => this.toggleRallyMode(),
      cancelQueue: (index) => {
        const b = this.selectedBuilding;
        if (!b || b.team !== 'player') return;
        if (cancelQueuedTrain(this.world, b, index)) playSfx('ui');
        else playSfx('ui');
      },
      train: (typeId) => {
        const b = this.selectedBuilding;
        if (!b || b.team !== 'player') return;
        if (queueTrain(this.world, b, typeId)) playSfx('train');
        else playSfx('ui');
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
      onQuit: () => this.scene.start('Menu'),
      ignoreOnMain: (objs) => {
        this.cameras.main.ignore(this.add.container(0, 0, objs));
      },
    });
    this.minimap = new Minimap(this, this.world, this.cameraCtl);
    this.tutorial = createTutorialState();
    this.coach = new TutorialCoach(this, this.tutorial);
    this.splitHudCamera([
      layer,
      this.boxGfx,
      this.unitGfx,
      this.ghostGfx,
      this.amoveReticleGfx,
      this.fogOverlay.gfx,
    ]);
    const onResize = (): void => {
      this.hud.layout();
      this.coach.layout();
      this.minimap.layout();
      this.hudCam.setSize(this.scale.width, this.scale.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off('resize', onResize),
    );

    this.shiftKey =
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT) ?? null;
    this.ctrlKey =
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL) ?? null;
    this.altKey =
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ALT) ?? null;
    this.controlGroups = createControlGroups();
    // Phaser reuses this scene object between matches.
    this.groupTaps.reset();

    this.bindInput();
    ensureAmbientBgm();
    this.input.once('pointerdown', () => ensureAmbientBgm());
    if (flags.adsEnabled) {
      console.warn(`[${BRAND.name}] ads should stay off`);
    }
  }

  /**
   * Phaser applies camera zoom to every object, scrollFactor 0 included, so
   * HUD drawn by the zoomed main camera drifts off the screen edges. A second
   * camera at zoom 1 draws the HUD instead: everything in `world` is hidden
   * from it, and everything else currently in the scene is hidden from main.
   */
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
      }
    });
    this.input.keyboard?.on('keydown-M', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.world.speciesId === 'weirdos') {
        toggleMutationSelected(this.world);
        playSfx('ui');
      }
    });
    this.input.keyboard?.on('keydown-R', () => {
      if (this.paused || this.matchResult !== 'ongoing') return;
      if (this.world.speciesId === 'brutes') {
        toggleRageSelected(this.world);
        playSfx('ui');
      }
    });
    // H / ? open the controls cheat sheet (Recruit stays on the ability pad).
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
  }

  /** Esc: close help, cancel place/A-move, else toggle pause (resume when open). */
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

  private setPaused(value: boolean): void {
    if (this.matchResult !== 'ongoing') return;
    if (value === this.paused) {
      if (value && !this.pauseMenu.isOpen) this.pauseMenu.show();
      return;
    }
    this.paused = value;
    if (value) {
      this.clearAttackMoveMode();
      this.mode = 'none';
      this.ghostGfx.clear();
      this.boxGfx.clear();
      this.cameraCtl.suppressPan = true;
      this.pauseMenu.show();
      playSfx('ui');
    } else {
      this.pauseMenu.hide();
      this.cameraCtl.suppressPan = false;
      this.hud.syncMuteLabel();
      playSfx('ui');
    }
  }

  /**
   * `now` is the key event's DOM timestamp (ms), used to spot a double-tap.
   * `repeat` marks OS auto-repeat while the key is held; it must not recall a
   * group again or count as a double-tap (holding 1-3 still keeps training).
   */
  private onDigitHotkey(slot: number, now: number, repeat: boolean): void {
    if (this.paused || this.matchResult !== 'ongoing') return;
    // Alt+N is a fallback: browsers can reserve Ctrl+digit for tab switching.
    if (this.ctrlHeld() || this.altHeld()) {
      this.groupTaps.reset();
      if (!repeat && assignControlGroup(this.world, this.controlGroups, slot)) {
        spawnControlGroupAssignFx(this.world, slot);
        this.hud.flashControlGroup(slot, 'assign');
        playSfx('select');
      }
      return;
    }
    // Production building still uses 1–3 to train when selected.
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
    if (repeat) return;
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
      // Pressing the same group key twice jumps the camera to it, as in StarCraft.
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
      const enemy = findEnemyAt(this.world, wp.x, wp.y, 'player');
      const node = findNodeAt(this.world, wp.x, wp.y);
      if (enemy) {
        issueAttackSelected(this.world, enemy);
        playSfx('attack');
      } else if (node) {
        issueGatherSelected(this.world, node);
        playSfx('gather');
      } else issueMoveSelected(this.world, wp.x, wp.y);
      this.mode = 'none';
      return;
    }
    this.mode = 'select';
    this.cameraCtl.suppressPan = true;
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
        } else {
          if (selectAt(this.world, wp.x, wp.y, additive)) playSfx('select');
          if (hit && !additive) {
            this.lastSelectTap = {
              t: this.time.now,
              unitId: hit.id,
              sx: pointer.x,
              sy: pointer.y,
            };
          } else {
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

  private refreshPlacementGhost(): void {
    if (this.mode !== 'place') {
      this.ghostGfx.clear();
      return;
    }
    this.ghostGfx.clear();
    drawPlacementGhost(this.ghostGfx, {
      x: this.ghostPos.x,
      y: this.ghostPos.y,
      typeId: this.placeType,
      valid: this.ghostValid,
      timeMs: this.animTimeMs,
      accent: this.playerSkinAccent,
    });
  }

  /** S / Stop — halt selection and flash halt rings. */
  private issueStopCommand(): void {
    const n = stopSelected(this.world);
    if (n <= 0) return;
    spawnStopPulses(this.world);
    this.hud.flashStopButton();
    playSfx('ui');
  }

  /** Home / Base HUD — snap camera to player keep. */
  private recenterOnPlayerBase(): void {
    const pt = findPlayerBasePoint(this.world);
    if (!pt) return;
    this.cameraCtl.centerOn(pt.x, pt.y);
    playSfx('ui');
  }

  /** Ctrl+A / Army HUD — fog-visible combat units only (not workers). */
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

  /** Brief screen-edge flash while friendlies are under enemy fire. */
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
    );
  }

  update(_t: number, delta: number): void {
    if (!this.paused) {
      this.animTimeMs += delta;
      this.cameraCtl.update(delta);
    }
    if (this.matchResult === 'ongoing' && !this.paused) {
      this.matchElapsedMs += delta;
      tickBattlefield(this.world, delta);
      tickBattlefieldEconomy(this.world);
      // Mute-aware gather/deposit SFX — fire once while FX is fresh.
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
      tickCoreFragments(this.world, delta);
      tickBattlefieldCombat(this.world, delta);
      // Attack flash just set (~120) — one SFX per frame max.
      if (this.world.units.some((u) => u.lastAttackFlashMs > 100)) {
        playSfx('attack');
      }
      if (this.world.coreClaimFlashMs > 180) {
        playSfx('ability');
      }
      // Under-attack pulse — mute-aware alert + soft camera nudge (rate-limited).
      const alert = this.world.underAttackAlert;
      if (alert?.pulse) {
        alert.pulse = false;
        playSfx('alert');
        this.cameraCtl.softNudgeToward(alert.x, alert.y);
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
    this.refreshHud(delta);
    this.coach.refresh();
    this.minimap.refresh(delta);
  }

  private showEndScreen(result: MatchResult): void {
    if (this.matchResult !== 'ongoing') return;
    if (result === 'ongoing') return;
    this.matchResult = result;
    if (this.paused) {
      this.paused = false;
      this.pauseMenu.hide();
    }
    this.clearAttackMoveMode();
    this.ghostGfx.clear();
    unmountSelectionPanel();
    this.hud.setBottomInset(0);
    this.minimap.setBottomInset(0);
    this.cameraCtl.suppressPan = true;
    this.writeEndMatchSummary(result);

    showKaneEndScreen({
      scene: this,
      win: result === 'victory',
      speciesId: this.world.speciesId,
      onMenu: () => this.scene.start('Menu'),
      onRematch: () => this.rematchSameSkirmish(),
      ignoreOnMain: (objs) => {
        this.cameras.main.ignore(this.add.container(0, 0, objs));
      },
    });
  }

  /** End-screen Rematch — same species + difficulty, no menu hop. */
  private rematchSameSkirmish(): void {
    const species = this.world.speciesId;
    const difficulty = this.world.aiDifficulty;
    rememberMatchPrefs(species, difficulty);
    recordGameStarted(species);
    void maybeRecordCloudGameStarted(species);
    this.scene.start('Battlefield', { species, difficulty });
  }

  /**
   * Always write local admin stub; also cloud write when email-authed
   * (client-trusted MVP — Functions deferred).
   */
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

    const selView = buildSelectionView(
      this.world,
      b,
      sel,
      this.mode === 'attackMove',
      this.mode === 'rally',
    );
    const panelOpen = renderSelectionPanel(selView);
    const inset = selectionPanelInsetPx(panelOpen);
    this.hud.setBottomInset(inset);
    this.minimap.setBottomInset(inset);

    // Compact top status — detail lives in the bottom selection panel.
    let status: string;
    if (this.mode === 'rally' && b) {
      status = `${b.name} · tap map to set rally · Esc cancel`;
    } else if (b) {
      status = `${b.name} selected · Train / Set rally below`;
    } else if (n === 0) {
      status = `Alive ${friends} vs ${foes}  ·  Select a unit or building`;
    } else if (n === 1) {
      status = `${sel[0]!.name} selected · orders below`;
    } else {
      status = `${n} selected · orders below · RMB`;
    }

    const placing = this.mode === 'place';
    const def = placing ? getBuildingType(this.placeType) : null;
    const hint = this.hud.controlHint(
      placing,
      def?.name,
      def?.cost.gold ?? 0,
      this.mode === 'attackMove',
    );
    this.hud.refresh(status, hint, dtMs);
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

    for (const b of this.world.buildings) {
      if (view && !inView(view, b.x, b.y)) continue;
      if (b.team === 'enemy' && !enemyRevealed(this.world.fog, b.x, b.y)) {
        continue;
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
  }

}
