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
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { getUnitType } from '../../data/units';
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
  recruitHero,
  tickHeroes,
} from '../../gameplay/battlefield/battlefieldHeroes';
import {
  tickMutations,
  toggleMutationSelected,
} from '../../gameplay/battlefield/battlefieldMutations';
import { BattlefieldHud } from '../ui/battlefieldHud';
import { Minimap } from '../ui/minimap';
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
import {
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
  clearSelection,
  createBattlefieldWorld,
  issueMoveSelected,
  selectAt,
  selectInRect,
  selectedCount,
  selectedUnits,
  tickBattlefield,
  type BattlefieldBuilding,
  type BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import { recordMatchResult } from '../../database/localStats';
import { playSfx } from '../audio/sfx';
import { RtsCamera } from '../camera/rtsCamera';
import { createSkirmishMap } from '../maps/mapManager';

type PointerMode = 'none' | 'select' | 'box' | 'pan' | 'place' | 'attackMove';

export class BattlefieldScene extends Phaser.Scene {
  private world!: BattlefieldWorld;
  private cameraCtl!: RtsCamera;
  private hudCam!: Phaser.Cameras.Scene2D.Camera;
  private boxGfx!: Phaser.GameObjects.Graphics;
  private unitGfx!: Phaser.GameObjects.Graphics;
  private ghostGfx!: Phaser.GameObjects.Graphics;
  private mode: PointerMode = 'none';
  private pointerStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  private cameraStart = { x: 0, y: 0 };
  private hud!: BattlefieldHud;
  private minimap!: Minimap;
  private tutorial!: TutorialState;
  private coach!: TutorialCoach;
  private shiftKey: Phaser.Input.Keyboard.Key | null = null;
  private ctrlKey: Phaser.Input.Keyboard.Key | null = null;
  private controlGroups!: ControlGroups;
  private placeables: BuildingTypeId[] = [];
  private placeIndex = 0;
  private placeType: BuildingTypeId = 'bonker_hut';
  private ghostPos = { x: 0, y: 0 };
  private ghostValid = false;
  private selectedBuilding: BattlefieldBuilding | null = null;
  private ai!: AiState;
  private matchResult: MatchResult = 'ongoing';

  constructor() {
    super('Battlefield');
  }

  create(data?: { species?: SpeciesId }): void {
    this.input.mouse?.disableContextMenu();

    const playerSpecies: SpeciesId =
      data?.species === 'nobles' || data?.species === 'weirdos'
        ? data.species
        : 'brutes';

    const { layer } = createSkirmishMap(this);
    this.world = createBattlefieldWorld(playerSpecies);
    this.placeables = placeableBuildings(playerSpecies);
    this.placeIndex = 0;
    this.placeType = this.placeables[0] ?? 'bonker_hut';
    this.ai = createAiState();
    this.cameraCtl = new RtsCamera(this);
    const first = this.world.units.find((u) => u.team === 'player');
    if (first) this.cameras.main.centerOn(first.x + 80, first.y - 40);

    this.boxGfx = this.add.graphics().setDepth(50);
    this.unitGfx = this.add.graphics().setDepth(10);

    this.ghostGfx = this.add.graphics().setDepth(40);

    this.hud = new BattlefieldHud(this, this.world);
    this.hud.menuBtn.on('pointerup', () => this.scene.start('Menu'));
    this.minimap = new Minimap(this, this.world, this.cameraCtl);
    this.tutorial = createTutorialState();
    this.coach = new TutorialCoach(this, this.tutorial);
    this.splitHudCamera([layer, this.boxGfx, this.unitGfx, this.ghostGfx]);
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
    this.controlGroups = createControlGroups();

    this.bindInput();
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
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.mode === 'place' || this.mode === 'attackMove') {
        this.mode = 'none';
        this.ghostGfx.clear();
      } else {
        clearSelection(this.world);
        this.clearBuildingSelection();
      }
    });
    this.input.keyboard?.on('keydown-B', () => {
      if (this.mode === 'place' && this.placeables.length > 1) {
        this.placeIndex = (this.placeIndex + 1) % this.placeables.length;
        this.placeType = this.placeables[this.placeIndex]!;
        this.drawGhost();
        return;
      }
      this.mode = this.mode === 'place' ? 'none' : 'place';
      if (this.mode === 'place' && this.placeables.length) {
        this.placeType = this.placeables[this.placeIndex]!;
      }
      if (this.mode !== 'place') this.ghostGfx.clear();
    });
    this.input.keyboard?.on('keydown-F', () => {
      if (this.world.speciesId === 'nobles') {
        toggleFormationSelected(this.world);
      }
    });
    this.input.keyboard?.on('keydown-M', () => {
      if (this.world.speciesId === 'weirdos') {
        toggleMutationSelected(this.world);
      }
    });
    this.input.keyboard?.on('keydown-H', () => {
      if (recruitHero(this.world, 'player')) playSfx('hero');
    });
    this.input.keyboard?.on('keydown-Q', () => {
      if (castHeroAbility(this.world, 'ability1', 'player')) playSfx('ability');
    });
    this.input.keyboard?.on('keydown-W', () => {
      if (castHeroAbility(this.world, 'ability2', 'player')) playSfx('ability');
    });
    this.input.keyboard?.on('keydown-E', () => {
      if (castHeroAbility(this.world, 'ultimate', 'player')) playSfx('ability');
    });
    this.input.keyboard?.on('keydown-S', () => {
      if (stopSelected(this.world) > 0) playSfx('ui');
    });
    this.input.keyboard?.on('keydown-A', () => {
      if (selectedCount(this.world) > 0) {
        this.mode = 'attackMove';
        playSfx('ui');
      }
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
      this.input.keyboard?.on(`keydown-${name}`, () => this.onDigitHotkey(slot));
    });
  }

  private onDigitHotkey(slot: number): void {
    if (this.ctrlHeld()) {
      if (assignControlGroup(this.world, this.controlGroups, slot)) {
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
      playSfx('train');
      return;
    }
    this.clearBuildingSelection();
    if (
      recallControlGroup(
        this.world,
        this.controlGroups,
        slot,
        this.shiftHeld(),
      ) > 0
    ) {
      playSfx('select');
    }
  }

  private clearBuildingSelection(): void {
    for (const b of this.world.buildings) b.selected = false;
    this.selectedBuilding = null;
  }

  private shiftHeld(): boolean {
    return !!this.shiftKey?.isDown;
  }

  private ctrlHeld(): boolean {
    return !!this.ctrlKey?.isDown;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.matchResult !== 'ongoing') return;
    if (pointer.y < 40 && pointer.x > this.scale.width - 80) return;

    this.pointerStart = { x: pointer.x, y: pointer.y };
    const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
    this.worldStart = { x: wp.x, y: wp.y };
    this.cameraStart = { ...this.cameraCtl.scroll };

    if (this.mode === 'attackMove' && pointer.leftButtonDown()) {
      if (issueAttackMoveSelected(this.world, wp.x, wp.y) > 0) playSfx('attack');
      this.mode = 'none';
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
      if (this.mode === 'place' || this.mode === 'attackMove') {
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
    const wp = this.cameraCtl.worldPoint(pointer.x, pointer.y);
    if (this.mode === 'place') {
      const def = getBuildingType(this.placeType);
      this.ghostPos = { x: wp.x, y: wp.y };
      this.ghostValid = !buildingBlocks(this.world, wp.x, wp.y, def.radius);
      this.drawGhost();
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
        playSfx('select');
      } else {
        this.clearBuildingSelection();
        if (selectAt(this.world, wp.x, wp.y, additive)) playSfx('select');
      }
    }
    this.mode = 'none';
  }

  private drawGhost(): void {
    const def = getBuildingType(this.placeType);
    this.ghostGfx.clear();
    const color = this.ghostValid ? 0x5dce6a : 0xe85a5a;
    this.ghostGfx.lineStyle(2, color, 0.95);
    this.ghostGfx.fillStyle(color, 0.25);
    this.ghostGfx.fillCircle(this.ghostPos.x, this.ghostPos.y, def.radius);
    this.ghostGfx.strokeCircle(this.ghostPos.x, this.ghostPos.y, def.radius);
  }

  update(_t: number, delta: number): void {
    this.cameraCtl.update(delta);
    if (this.matchResult === 'ongoing') {
      tickBattlefield(this.world, delta);
      tickBattlefieldEconomy(this.world);
      tickBuildings(this.world, delta);
      tickProduction(this.world, delta);
      tickFormations(this.world, delta);
      tickMutations(this.world, delta);
      tickHeroes(this.world, delta);
      tickBattlefieldAi(this.world, this.ai, delta);
      tickBattlefieldCombat(this.world, delta);
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
    this.drawWorld();
    this.refreshHud();
    this.coach.refresh();
    this.minimap.refresh();
  }

  private showEndScreen(result: MatchResult): void {
    if (this.matchResult !== 'ongoing') return;
    this.matchResult = result;
    this.mode = 'none';
    this.ghostGfx.clear();
    this.cameraCtl.suppressPan = true;
    playSfx(result === 'victory' ? 'victory' : 'defeat');
    recordMatchResult(this.world.speciesId, result === 'victory');

    const { width, height } = this.scale;
    const win = result === 'victory';
    const bg = this.add
      .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.72)
      .setScrollFactor(0)
      .setDepth(200);
    const title = this.add
      .text(
        width / 2,
        height * 0.38,
        win ? 'VICTORY' : 'DEFEAT',
        {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '56px',
          color: win ? '#f0c75e' : '#e85a5a',
          stroke: '#000',
          strokeThickness: 6,
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
    const sub = this.add
      .text(
        width / 2,
        height * 0.5,
        win
          ? `Enemy hall destroyed — ${SPECIES[this.world.speciesId].name} claim the field.`
          : `Your hall fell — ${SPECIES[this.world.speciesId].name} need a rematch.`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          color: '#d7e6f2',
          align: 'center',
          wordWrap: { width: Math.min(480, width - 40) },
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
    const btn = this.add
      .text(width / 2, height * 0.62, 'Return to Menu', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#fff8e8',
        backgroundColor: '#3a4555',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('Menu'));

    // Added after splitHudCamera, so keep it off the zoomed main camera.
    this.cameras.main.ignore(this.add.container(0, 0, [bg, title, sub, btn]));
  }

  private refreshHud(): void {
    const n = selectedCount(this.world);
    const sel = selectedUnits(this.world);
    const friends = livingByTeam(this.world, 'player');
    const foes = livingByTeam(this.world, 'enemy');
    const b = this.selectedBuilding;
    let status = '';
    if (b) {
      const trains = getBuildingType(b.typeId).trains;
      const labels = trains
        .map((id, i) => {
          const d = getUnitType(id);
          return `${i + 1}:${d.name}(${d.costGold}g${d.costCrystals ? '/' + d.costCrystals + 'c' : ''})`;
        })
        .join('  ');
      const q =
        b.trainQueue.length > 0
          ? ` · queue ${b.trainQueue.length} (${Math.floor((b.trainProgressMs / getUnitType(b.trainQueue[0]!).trainMs) * 100)}%)`
          : '';
      status = `${b.name}  HP ${Math.ceil(b.hp)}/${b.maxHp}${q}  ·  ${labels}`;
    } else if (n === 0) {
      status = `Alive ${friends} vs ${foes}  ·  Select hall to train · use hero pads below`;
    } else if (n === 1) {
      const u = sel[0]!;
      const carry =
        u.carrying > 0
          ? ` · carrying ${u.carrying} ${u.carryingResource ?? ''}`
          : u.canGather
            ? ' · worker'
            : '';
      const form = u.inFormation ? ' · FORMATION' : '';
      const mut = u.mutated ? ' · MUTATED' : '';
      status = `1 selected — ${u.name}  HP ${Math.ceil(u.hp)}/${u.maxHp}${carry}${form}${mut}`;
    } else {
      const formed = sel.filter((u) => u.inFormation).length;
      const mutated = sel.filter((u) => u.mutated).length;
      const extra = [
        formed ? `${formed} in formation` : '',
        mutated ? `${mutated} mutated` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      status = `${n} selected${extra ? ` · ${extra}` : ''}  ·  RMB / long-press for orders`;
    }

    const placing = this.mode === 'place';
    const def = placing ? getBuildingType(this.placeType) : null;
    const hint = this.hud.controlHint(
      placing,
      def?.name,
      def?.cost.gold ?? 0,
      this.mode === 'attackMove',
    );
    this.hud.refresh(status, hint);
  }

  private drawWorld(): void {
    const g = this.unitGfx;
    g.clear();

    for (const v of this.world.vfx) {
      const a = Math.max(0.15, v.lifeMs / v.maxLifeMs);
      g.lineStyle(3, v.color, a);
      g.strokeCircle(v.x, v.y, v.radius * (1.15 - a * 0.3));
      g.fillStyle(v.color, a * 0.12);
      g.fillCircle(v.x, v.y, v.radius * (1.05 - a * 0.2));
    }

    for (const b of this.world.buildings) {
      const alpha = b.complete ? 1 : 0.45 + 0.4 * b.buildProgress;
      const def = getBuildingType(b.typeId);
      // Soft shadow
      g.fillStyle(0x000000, 0.28 * alpha);
      g.fillEllipse(b.x, b.y + b.radius * 0.75, b.radius * 1.5, b.radius * 0.45);
      g.fillStyle(b.color, alpha);
      g.fillRoundedRect(
        b.x - b.radius,
        b.y - b.radius,
        b.radius * 2,
        b.radius * 2,
        6,
      );
      // Accent roof / crystal nub
      g.fillStyle(b.accent, alpha);
      if (def.isMainHall) {
        g.fillTriangle(
          b.x - b.radius * 0.7,
          b.y - b.radius * 0.2,
          b.x + b.radius * 0.7,
          b.y - b.radius * 0.2,
          b.x,
          b.y - b.radius * 1.15,
        );
      } else {
        g.fillCircle(b.x, b.y - b.radius * 0.55, b.radius * 0.28);
      }
      g.lineStyle(2, b.selected ? 0xf0c75e : b.accent, b.selected ? 1 : 0.9);
      g.strokeRoundedRect(
        b.x - b.radius,
        b.y - b.radius,
        b.radius * 2,
        b.radius * 2,
        6,
      );
      if (b.trainQueue.length > 0) {
        const tw = b.radius * 2;
        const udef = getUnitType(b.trainQueue[0]!);
        const tp = Math.min(1, b.trainProgressMs / udef.trainMs);
        g.fillStyle(0x1a1a1a, 0.8);
        g.fillRect(b.x - b.radius, b.y + b.radius + 10, tw, 4);
        g.fillStyle(0x7ec8ff, 1);
        g.fillRect(b.x - b.radius, b.y + b.radius + 10, tw * tp, 4);
      }
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
      g.lineStyle(1, s.team === 'player' ? 0xf0c75e : 0xc4a0e0, 0.35);
      g.strokeCircle(s.x, s.y, s.radius);
    }

    for (const n of this.world.nodes) {
      if (n.remaining <= 0) continue;
      const def = RESOURCES[n.resourceId];
      const pct = n.remaining / n.maxAmount;
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(n.x, n.y + n.radius * 0.55, n.radius * 1.4, n.radius * 0.45);
      if (n.resourceId === 'magic_crystals') {
        g.fillStyle(def.color, 0.4 + 0.5 * pct);
        g.fillTriangle(
          n.x,
          n.y - n.radius,
          n.x + n.radius * 0.85,
          n.y + n.radius * 0.7,
          n.x - n.radius * 0.85,
          n.y + n.radius * 0.7,
        );
        g.fillStyle(0xffffff, 0.55);
        g.fillTriangle(
          n.x,
          n.y - n.radius * 0.45,
          n.x + n.radius * 0.35,
          n.y + n.radius * 0.25,
          n.x - n.radius * 0.35,
          n.y + n.radius * 0.25,
        );
      } else {
        g.fillStyle(def.color, 0.45 + 0.45 * pct);
        g.fillCircle(n.x - 4, n.y, n.radius * 0.7);
        g.fillCircle(n.x + 6, n.y + 2, n.radius * 0.55);
        g.fillStyle(0xfff0b0, 0.7);
        g.fillCircle(n.x, n.y - 4, n.radius * 0.35);
      }
      g.lineStyle(2, def.color, 0.9);
      g.strokeCircle(n.x, n.y, n.radius);
    }

    for (const u of this.world.units) {
      if (u.selected) {
        g.lineStyle(1, 0xf0c75e, 0.35);
        g.strokeCircle(u.x, u.y, u.range);
        g.lineStyle(2, 0xf0c75e, 1);
        g.strokeCircle(u.x, u.y, u.radius + 6);
      }
      if (u.inFormation) {
        g.lineStyle(2, 0xc0c8d4, 0.95);
        g.strokeCircle(u.x, u.y, u.radius + 9);
      }
      if (u.mutated) {
        g.lineStyle(2, 0xe87aa8, 0.95);
        g.strokeCircle(u.x, u.y, u.radius + 10);
      }

      const flash = u.lastAttackFlashMs > 0;
      g.fillStyle(flash ? 0xffffff : u.color, 1);
      this.drawUnitBody(g, u.x, u.y, u.radius, getUnitType(u.typeId).shape);
      g.fillStyle(u.team === 'player' ? 0xf0c75e : 0xe8a0ff, 0.95);
      g.fillCircle(u.x, u.y - 5, 3.5);

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
        g.lineBetween(u.x, u.y, u.moveTarget.x, u.moveTarget.y);
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

  private drawUnitBody(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    r: number,
    shape: ReturnType<typeof getUnitType>['shape'],
  ): void {
    // Contact shadow
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(x, y + r * 0.65, r * 1.35, r * 0.4);

    if (shape === 'square') {
      g.fillRect(x - r, y - r, r * 2, r * 2);
    } else if (shape === 'diamond') {
      g.fillTriangle(x, y - r, x + r, y, x, y + r);
      g.fillTriangle(x, y - r, x - r, y, x, y + r);
    } else if (shape === 'triangle') {
      g.fillTriangle(x, y - r, x + r, y + r * 0.7, x - r, y + r * 0.7);
    } else if (shape === 'hex') {
      for (let i = 0; i < 6; i++) {
        const a0 = (Math.PI / 3) * i - Math.PI / 6;
        const a1 = (Math.PI / 3) * (i + 1) - Math.PI / 6;
        g.fillTriangle(
          x,
          y,
          x + Math.cos(a0) * r,
          y + Math.sin(a0) * r,
          x + Math.cos(a1) * r,
          y + Math.sin(a1) * r,
        );
      }
    } else if (shape === 'star') {
      g.fillCircle(x, y, r);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        g.fillCircle(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, r * 0.22);
      }
    } else {
      g.fillCircle(x, y, r);
    }

    // Eyes — readable silhouette detail
    g.fillStyle(0xfff8e8, 0.95);
    g.fillCircle(x - r * 0.28, y - r * 0.15, r * 0.22);
    g.fillCircle(x + r * 0.28, y - r * 0.15, r * 0.22);
    g.fillStyle(0x0a1220, 0.95);
    g.fillCircle(x - r * 0.28, y - r * 0.12, r * 0.1);
    g.fillCircle(x + r * 0.28, y - r * 0.12, r * 0.1);
  }
}
