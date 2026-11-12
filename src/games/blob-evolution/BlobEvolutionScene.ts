/**
 * BlobEvolutionScene — Phaser wrapper for the Three.js Blob Evolution game.
 * The Three.js game runs in a canvas, Phaser handles the UI overlay.
 *
 * Called by: src/main.ts (registers in scene array as 'BlobEvolution')
 * Replaces: games/blob-evolution/main.js (DOM-based entry)
 * Reads: Three.js game logic ported to TypeScript
 * No existing file serves this purpose - new wrapper scene for Phase 4
 */
import Phaser from 'phaser';
import * as THREE from 'three';
import { t } from '../../i18n';
import { ensureAmbientBgm } from '../../presentation/audio/bgm';
import { playSfx } from '../../presentation/audio/sfx';
import {
  blobChain,
  blobChoiceLabel,
  blobEaten,
  blobEndPill,
  blobHudHint,
  blobHudLine,
  blobRpsLose,
  blobRpsLoseTitle,
  blobRpsOpen,
  blobRpsTie,
  blobRpsWin,
  blobWin,
} from '../../../games/blob-evolution/blobCopy';
import {
  type AngelAscension,
  buildArena,
  clearAscension,
  disposeBlob,
  disposeBlobArt,
  followCamera,
  makeBlob,
  poseBlob,
  startAscension,
  updateAscension,
} from './blobArt';
import { BlobPanel, type BlobPanelSpec, createBackPill } from './blobPanels';
import {
  ANGEL_STAGE,
  ARENA,
  BOT_CHASE_RANGE,
  BOT_COUNT,
  BOT_RESPONSE,
  BOT_THINK_MIN,
  BOT_THINK_SPREAD,
  BOT_WANDER_CHANCE,
  PLAYER_RESPONSE,
  PLAYER_START_STAGE,
  RAINBOW_STAGE,
  RPS_CHOICES,
  type RpsChoice,
  STAGES,
  approach,
  botStagePlan,
  canEat,
  findChaseTarget,
  rpsOutcome,
  spawnPoint,
  wanderTarget,
} from './blobRules';

interface Bot {
  stage: number;
  radius: number;
  /** Top speed in arena units per second. */
  speed: number;
  x: number;
  z: number;
  /** Velocity in arena units per second. */
  vx: number;
  vz: number;
  tx: number;
  tz: number;
  /** Seconds until a bot next decides where to go. */
  think: number;
  /** Heading in radians, so the blob faces where it is going. */
  facing: number;
  /** Offsets the idle bob so bots do not wobble in unison. */
  phase: number;
  alive: boolean;
  group: THREE.Group;
}

export class BlobEvolutionScene extends Phaser.Scene {
  private threeCanvas: HTMLCanvasElement | null = null;
  private threeScene: THREE.Scene | null = null;
  private threeCamera: THREE.PerspectiveCamera | null = null;
  private threeRenderer: THREE.WebGLRenderer | null = null;
  private threeClock: THREE.Clock | null = null;

  private player: Bot | null = null;
  private bots: Bot[] = [];
  private running = false;
  private duelBot: Bot | null = null;
  private duelBusy = false;
  private playerGroup: THREE.Group | null = null;
  private lastHud = 0;

  private hudText: Phaser.GameObjects.Text | null = null;
  private hintText: Phaser.GameObjects.Text | null = null;
  private touchHelpText: Phaser.GameObjects.Text | null = null;

  private panel: BlobPanel | null = null;
  private ascension: AngelAscension | null = null;
  /** Blocks a second click on a rock-paper-scissors key while a win is being shown. */
  private rpsLocked = false;

  private keys: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;

  // Touch stick
  private stickActive = false;
  private stickKnob: Phaser.GameObjects.Graphics | null = null;
  private stickBase: Phaser.GameObjects.Graphics | null = null;
  private touchId: number | null = null;

  constructor() {
    super('BlobEvolution');
  }

  create(): void {
    this.createThreeCanvas();
    this.createThreeScene();
    this.createPhaserUI();
    this.setupInput();
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    this.showStartPanel();
  }

  private createThreeCanvas(): void {
    // Create a separate canvas for Three.js, positioned behind Phaser
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);
    this.threeCanvas = canvas;
  }

  private createThreeScene(): void {
    if (!this.threeCanvas) return;
    const { width, height } = this.scale;

    this.threeScene = new THREE.Scene();
    buildArena(this.threeScene);

    this.threeCamera = new THREE.PerspectiveCamera(52, width / height, 0.1, 180);
    this.threeCamera.position.set(0, 17, 20);

    // The Three.js canvas sits behind the (transparent) Phaser canvas, so it needs no alpha of its own.
    this.threeRenderer = new THREE.WebGLRenderer({ canvas: this.threeCanvas, antialias: true });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.threeRenderer.shadowMap.enabled = true;
    this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.threeClock = new THREE.Clock();
  }

  private createPhaserUI(): void {
    const { width, height } = this.scale;

    // HUD sits to the right of the back pill, as in the original.
    this.hudText = this.add
      .text(118, 20, 'BLOB EVOLUTION', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#b8e3ff',
        lineSpacing: 5,
        stroke: '#071321',
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.hintText = this.add
      .text(118, 108, blobHudHint(), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#91a9c1',
        stroke: '#071321',
        strokeThickness: 3,
        wordWrap: { width: Math.max(160, width - 140) },
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.touchHelpText = this.add
      .text(width - 16, height - 14, t('blob.touchHelp'), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: 'rgba(230, 241, 255, 0.48)',
        align: 'right',
        wordWrap: { width: width * 0.46 },
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(20);

    createBackPill(this, `← ${t('hub.title')}`, () => this.scene.start('GamePicker'));

    this.createTouchStick();
  }

  /** Keeps the hint and bottom-right help inside the canvas after a resize. */
  private layoutHud(): void {
    const { width, height } = this.scale;
    this.hintText?.setWordWrapWidth(Math.max(160, width - 140));
    this.touchHelpText?.setPosition(width - 16, height - 14).setWordWrapWidth(width * 0.46);
  }

  private createTouchStick(): void {
    const { height } = this.scale;
    const baseX = 100;
    const baseY = height - 100;
    const baseRadius = 66;
    const knobRadius = 29;

    this.stickBase = this.add.graphics();
    this.stickBase.fillStyle(0x12253c, 0.55);
    this.stickBase.lineStyle(2, 0x7be0ff, 0.35);
    this.stickBase.fillCircle(baseX, baseY, baseRadius);
    this.stickBase.strokeCircle(baseX, baseY, baseRadius);
    this.stickBase.setScrollFactor(0).setDepth(10).setVisible(false);

    this.stickKnob = this.add.graphics();
    this.stickKnob.fillStyle(0x7be0ff, 0.88);
    this.stickKnob.lineStyle(2, 0xffffff, 0.55);
    this.stickKnob.fillCircle(baseX, baseY, knobRadius);
    this.stickKnob.strokeCircle(baseX, baseY, knobRadius);
    this.stickKnob.setScrollFactor(0).setDepth(11).setVisible(false);
  }

  private setupInput(): void {
    this.keys = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Touch input for stick
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);
  }

  private onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (this.running && !this.duelBusy) {
      const { height } = this.scale;
      const baseX = 100;

      if (pointer.x < baseX * 2 && pointer.y > height - baseX * 2) {
        this.stickActive = true;
        this.touchId = pointer.id;
        this.stickBase?.setVisible(true);
        this.stickKnob?.setVisible(true);
      }
    }
  };

  private onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.stickActive || this.touchId !== pointer.id) return;

    const { height } = this.scale;
    const baseX = 100;
    const baseY = height - 100;
    const baseRadius = 66;
    const knobRadius = 29;

    const dx = pointer.x - baseX;
    const dy = pointer.y - baseY;
    const dist = Math.hypot(dx, dy);
    const maxDist = baseRadius - knobRadius;

    let knobX = pointer.x;
    let knobY = pointer.y;

    if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      knobX = baseX + Math.cos(angle) * maxDist;
      knobY = baseY + Math.sin(angle) * maxDist;
    }

    this.stickKnob?.setPosition(knobX, knobY);
  };

  private onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (this.touchId === pointer.id) {
      this.stickActive = false;
      this.touchId = null;
      this.stickBase?.setVisible(false);
      this.stickKnob?.setVisible(false);
      this.stickKnob?.setPosition(100, this.scale.height - 100);
    }
  };

  private getStickDirection(): { x: number; z: number } {
    if (!this.stickActive) return { x: 0, z: 0 };

    const { height } = this.scale;
    const baseX = 100;
    const baseY = height - 100;

    const knobX = this.stickKnob?.x ?? baseX;
    const knobY = this.stickKnob?.y ?? baseY;

    const dx = knobX - baseX;
    const dy = knobY - baseY;
    const dist = Math.hypot(dx, dy);
    const baseRadius = 66;
    const knobRadius = 29;
    const maxDist = baseRadius - knobRadius;

    if (dist < 5) return { x: 0, z: 0 };

    const angle = Math.atan2(dy, dx);
    const strength = Math.min(dist / maxDist, 1);

    return {
      x: Math.cos(angle) * strength,
      z: Math.sin(angle) * strength,
    };
  }

  private getKeyboardDirection(): { x: number; z: number } {
    let x = 0;
    let z = 0;

    if (this.keys?.up.isDown || this.wasdKeys?.W.isDown) z -= 1;
    if (this.keys?.down.isDown || this.wasdKeys?.S.isDown) z += 1;
    if (this.keys?.left.isDown || this.wasdKeys?.A.isDown) x -= 1;
    if (this.keys?.right.isDown || this.wasdKeys?.D.isDown) x += 1;

    const dist = Math.hypot(x, z);
    if (dist > 0) {
      x /= dist;
      z /= dist;
    }

    return { x, z };
  }

  private getMoveDirection(): { x: number; z: number } {
    const stick = this.getStickDirection();
    const keys = this.getKeyboardDirection();

    // Prefer stick if active, otherwise keys
    if (this.stickActive && (stick.x !== 0 || stick.z !== 0)) {
      return stick;
    }
    return keys;
  }

  private showStartPanel(): void {
    this.openPanel({
      pill: t('blob.pill'),
      title: 'Blob Evolution',
      copy: t('blob.startBlurb'),
      chain: blobChain(),
      note: t('blob.note'),
      buttons: [{ label: t('blob.start'), onClick: () => this.startGame() }],
    });
  }

  private startGame(): void {
    this.closePanel();
    if (this.threeScene) clearAscension(this.threeScene, this.ascension);
    this.ascension = null;
    this.duelBot = null;
    this.duelBusy = false;
    this.rpsLocked = false;
    ensureAmbientBgm();
    playSfx('ui');
    this.spawnGame();
  }

  private spawnGame(): void {
    if (!this.threeScene || !this.threeRenderer) return;

    // Clear existing
    if (this.playerGroup) {
      this.threeScene.remove(this.playerGroup);
      disposeBlob(this.playerGroup);
    }
    for (const bot of this.bots) {
      this.threeScene.remove(bot.group);
      disposeBlob(bot.group);
    }
    this.bots = [];

    // Create player
    const startStage = PLAYER_START_STAGE;
    this.player = {
      stage: startStage,
      radius: STAGES[startStage].radius,
      speed: STAGES[startStage].speed,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      tx: 0,
      tz: 0,
      think: 0,
      facing: 0,
      phase: 0,
      alive: true,
      group: makeBlob(startStage),
    };
    this.playerGroup = this.player.group;
    this.threeScene.add(this.playerGroup);

    // Create bots: half Purple, half Blue, scattered across the arena
    for (const stage of botStagePlan(BOT_COUNT)) {
      this.spawnBot(stage);
    }

    this.running = true;
    this.updateHud(true);
  }

  private spawnBot(stage: number): void {
    if (!this.threeScene) return;

    const { x, z } = spawnPoint();

    const bot: Bot = {
      stage,
      radius: STAGES[stage].radius,
      speed: STAGES[stage].speed,
      x,
      z,
      vx: 0,
      vz: 0,
      tx: x,
      tz: z,
      think: 0,
      facing: 0,
      phase: Math.random() * Math.PI * 2,
      alive: true,
      group: makeBlob(stage),
    };

    this.threeScene.add(bot.group);
    this.bots.push(bot);
  }

  private distance(a: Bot, b: Bot): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.hypot(dx, dz);
  }

  private canEat(eaterStage: number, preyStage: number): boolean {
    return canEat(eaterStage, preyStage);
  }

  private playerEat(bot: Bot): void {
    if (!this.player) return;

    this.removeBot(bot);
    playSfx('gather');

    if (this.player.stage < RAINBOW_STAGE) {
      this.evolvePlayer(this.player.stage + 1);
      playSfx('build');
    }

    this.updateHud(true);
    this.checkVictory();
  }

  private evolvePlayer(stage: number): void {
    const player = this.player;
    if (!player || !this.threeScene) return;

    player.stage = stage;
    player.radius = STAGES[stage].radius;
    player.speed = STAGES[stage].speed;

    if (this.playerGroup) {
      this.threeScene.remove(this.playerGroup);
      disposeBlob(this.playerGroup);
    }
    this.playerGroup = makeBlob(stage);
    player.group = this.playerGroup;
    this.threeScene.add(this.playerGroup);
    this.updateHud(true);
  }

  private loseGame(): void {
    this.running = false;
    playSfx('defeat');
    const eaten = blobEaten();
    this.openEndPanel(false, eaten.title, eaten.body);
  }

  /** The last blob standing ascends: it becomes the Angel and the ascension plays before the win panel. */
  private checkVictory(): void {
    if (!this.running || this.ascension || !this.threeScene) return;
    if (!this.bots.every((b) => !b.alive)) return;

    this.running = false;
    this.evolvePlayer(ANGEL_STAGE);
    if (this.playerGroup) {
      this.ascension = startAscension(this.threeScene, this.playerGroup, performance.now());
    }
    playSfx('victory');
  }

  private finishAscension(): void {
    if (this.threeScene) clearAscension(this.threeScene, this.ascension);
    this.ascension = null;
    const won = blobWin();
    this.openEndPanel(true, won.title, won.body);
  }

  private openEndPanel(won: boolean, title: string, body: string): void {
    this.openPanel({
      pill: blobEndPill(won),
      title,
      copy: body,
      buttons: [{ label: t('blob.playAgain'), onClick: () => this.startGame() }],
    });
  }

  private openPanel(spec: BlobPanelSpec): void {
    this.closePanel();
    this.panel = new BlobPanel(this, spec);
  }

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = null;
  }

  private updatePlayer(dt: number): void {
    if (!this.player || !this.player.alive) return;

    // Velocity eases toward (direction × top speed) and is applied per second,
    // so the blob moves at the same pace at any frame rate.
    const input = this.getMoveDirection();
    if (input.x !== 0 || input.z !== 0) this.player.facing = Math.atan2(input.x, input.z);
    this.player.vx = approach(this.player.vx, input.x * this.player.speed, dt, PLAYER_RESPONSE);
    this.player.vz = approach(this.player.vz, input.z * this.player.speed, dt, PLAYER_RESPONSE);

    this.player.x += this.player.vx * dt;
    this.player.z += this.player.vz * dt;

    // Boundary clamp
    const lim = ARENA - this.player.radius * 0.8;
    this.player.x = Phaser.Math.Clamp(this.player.x, -lim, lim);
    this.player.z = Phaser.Math.Clamp(this.player.z, -lim, lim);
  }

  private updateBots(dt: number): void {
    for (const bot of this.bots) {
      if (!bot.alive) continue;

      // A bot re-decides every quarter to two thirds of a second: hunt the nearest
      // thing it can eat (the player only if it can eat them), otherwise wander.
      bot.think -= dt;
      if (bot.think <= 0) {
        bot.think = BOT_THINK_MIN + Math.random() * BOT_THINK_SPREAD;
        const chase = findChaseTarget(bot, this.player, this.bots, BOT_CHASE_RANGE);
        if (chase) {
          bot.tx = chase.x;
          bot.tz = chase.z;
        } else if (Math.random() < BOT_WANDER_CHANCE) {
          const wander = wanderTarget(bot);
          bot.tx = wander.x;
          bot.tz = wander.z;
        }
      }

      let dx = bot.tx - bot.x;
      let dz = bot.tz - bot.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.2) {
        dx /= dist;
        dz /= dist;
        bot.facing = Math.atan2(dx, dz);
      } else {
        dx = 0;
        dz = 0;
      }

      bot.vx = approach(bot.vx, dx * bot.speed, dt, BOT_RESPONSE);
      bot.vz = approach(bot.vz, dz * bot.speed, dt, BOT_RESPONSE);

      bot.x += bot.vx * dt;
      bot.z += bot.vz * dt;

      const lim = ARENA - bot.radius * 0.8;
      if (bot.x > lim || bot.x < -lim) {
        bot.vx *= -0.7;
        bot.tx = -bot.tx * 0.8;
        bot.x = Phaser.Math.Clamp(bot.x, -lim, lim);
      }
      if (bot.z > lim || bot.z < -lim) {
        bot.vz *= -0.7;
        bot.tz = -bot.tz * 0.8;
        bot.z = Phaser.Math.Clamp(bot.z, -lim, lim);
      }
    }
  }

  private bounceApart(a: Bot, b: Bot): void {
    let dx = a.x - b.x;
    let dz = a.z - b.z;
    let dist = Math.hypot(dx, dz);
    if (dist < 1e-4) {
      dx = Math.random() - 0.5;
      dz = Math.random() - 0.5;
      dist = Math.hypot(dx, dz) || 1;
    }
    dx /= dist;
    dz /= dist;

    const overlap = (a.radius + b.radius) * 0.78 - dist;
    if (overlap <= 0) return;

    const massA = Math.max(0.2, a.radius * a.radius);
    const massB = Math.max(0.2, b.radius * b.radius);
    const total = massA + massB;

    const pushA = (massB / total) * overlap;
    const pushB = (massA / total) * overlap;

    a.x += dx * pushA;
    a.z += dz * pushA;
    b.x -= dx * pushB;
    b.z -= dz * pushB;

    const bounce = 4.8;
    const kickA = bounce * (massB / total);
    const kickB = bounce * (massA / total);

    a.vx += dx * kickA;
    a.vz += dz * kickA;
    b.vx -= dx * kickB;
    b.vz -= dz * kickB;

    if ('tx' in a) {
      a.tx = a.x + dx * 2.5;
      a.tz = a.z + dz * 2.5;
    }
    if ('tx' in b) {
      b.tx = b.x - dx * 2.5;
      b.tz = b.z - dz * 2.5;
    }

    const limA = ARENA - a.radius * 0.8;
    const limB = ARENA - b.radius * 0.8;
    a.x = Phaser.Math.Clamp(a.x, -limA, limA);
    a.z = Phaser.Math.Clamp(a.z, -limA, limA);
    b.x = Phaser.Math.Clamp(b.x, -limB, limB);
    b.z = Phaser.Math.Clamp(b.z, -limB, limB);
  }

  private resolveCollisions(): void {
    if (!this.running || !this.player) return;

    for (const bot of this.bots) {
      if (!bot.alive) continue;

      const d = this.distance(this.player, bot);
      if (d < this.player.radius + bot.radius * 0.78) {
        if (this.player.stage === 4 && bot.stage === 4) {
          this.showRPS(bot);
          return;
        }
        if (this.canEat(this.player.stage, bot.stage)) {
          this.playerEat(bot);
          if (!this.running) return;
        } else if (this.canEat(bot.stage, this.player.stage)) {
          this.loseGame();
          return;
        } else {
          this.bounceApart(this.player, bot);
        }
      }
    }

    // Bot vs bot collisions
    for (let i = 0; i < this.bots.length; i++) {
      const a = this.bots[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < this.bots.length; j++) {
        const b = this.bots[j];
        if (!b.alive) continue;

        if (this.distance(a, b) < (a.radius + b.radius) * 0.78) {
          if (a.stage === 4 && b.stage === 4) {
            if (Math.random() < 0.5) this.botEat(a, b);
            else this.botEat(b, a);
          } else if (this.canEat(a.stage, b.stage)) {
            this.botEat(a, b);
          } else if (this.canEat(b.stage, a.stage)) {
            this.botEat(b, a);
          } else {
            this.bounceApart(a, b);
          }
        }
      }
    }

    this.checkVictory();
  }

  private botEat(eater: Bot, prey: Bot): void {
    if (!eater.alive || !prey.alive || !this.threeScene) return;

    this.removeBot(prey);
    playSfx('gather');

    if (eater.stage < RAINBOW_STAGE) {
      eater.stage++;
      eater.radius = STAGES[eater.stage].radius;
      eater.speed = STAGES[eater.stage].speed;
      this.threeScene.remove(eater.group);
      disposeBlob(eater.group);
      eater.group = makeBlob(eater.stage);
      this.threeScene.add(eater.group);
      playSfx('build');
    }
  }

  private removeBot(bot: Bot): void {
    if (!bot.alive) return;
    bot.alive = false;
    this.threeScene?.remove(bot.group);
    disposeBlob(bot.group);
  }

  private showRPS(opponent: Bot): void {
    if (this.duelBusy || !this.running) return;
    this.duelBot = opponent;
    this.duelBusy = true;
    this.running = false;
    this.rpsLocked = false;
    playSfx('alert');

    const open = blobRpsOpen();
    this.openPanel({
      pill: open.pill,
      title: open.title,
      copy: open.copy,
      result: '',
      note: t('blob.rpsHint'),
      buttons: RPS_CHOICES.map((choice) => ({
        label: blobChoiceLabel(choice),
        choice: true,
        onClick: () => this.chooseRPS(choice),
      })),
    });
  }

  private chooseRPS(choice: RpsChoice): void {
    const bot = this.duelBot;
    if (!this.duelBusy || !bot || !bot.alive || this.rpsLocked) return;

    const botChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
    const outcome = rpsOutcome(choice, botChoice);

    if (outcome === 'tie') {
      this.panel?.setResult(blobRpsTie(choice));
      return;
    }

    this.rpsLocked = true;
    if (outcome === 'win') {
      this.panel?.setResult(blobRpsWin(choice, botChoice));
      this.time.delayedCall(900, () => {
        this.removeBot(bot);
        playSfx('gather');
        this.duelBot = null;
        this.duelBusy = false;
        this.closePanel();
        this.running = true;
        this.checkVictory();
      });
      return;
    }

    this.duelBot = null;
    this.duelBusy = false;
    playSfx('defeat');
    this.openPanel({
      pill: blobEndPill(false),
      title: blobRpsLoseTitle(),
      copy: blobRpsLose(choice, botChoice),
      buttons: [{ label: t('blob.restart'), onClick: () => this.startGame() }],
    });
  }

  private updateHud(force = false): void {
    if (!this.hudText || !this.player) return;

    const now = performance.now();
    if (!force && now - this.lastHud < 100) return;
    this.lastHud = now;

    const remaining = this.bots.filter((b) => b.alive).length;
    const { stage, radius, speed } = this.player;
    this.hudText.setText(blobHudLine(stage, radius, speed, remaining));
    this.hudText.setColor(stage === 4 ? '#ffdb72' : stage === 3 ? '#d8d0c4' : stage === 2 ? '#8df4bc' : '#b8e3ff');
  }

  update(_time: number, delta: number): void {
    if (!this.threeRenderer || !this.threeScene || !this.threeCamera || !this.threeClock) return;

    const dt = Math.min(delta / 1000, 0.04);

    if (this.running && this.player) {
      this.updatePlayer(dt);
      this.updateBots(dt);
      this.resolveCollisions();
      this.updateHud();
    }

    this.renderFrame(dt);
  }

  /** Pose every blob, move the camera and draw. Runs every frame, also behind a panel or during the ascension. */
  private renderFrame(dt: number): void {
    if (!this.threeRenderer || !this.threeScene || !this.threeCamera || !this.threeClock) return;
    const time = this.threeClock.getElapsedTime();

    if (this.ascension && this.player && this.playerGroup) {
      const done = updateAscension(this.ascension, this.playerGroup, this.player, this.threeCamera, performance.now(), time);
      this.threeRenderer.render(this.threeScene, this.threeCamera);
      if (done) this.finishAscension();
      return;
    }

    if (this.player && this.playerGroup) {
      poseBlob(this.playerGroup, this.player, time, 0, true);
    }
    for (const bot of this.bots) {
      if (bot.alive) poseBlob(bot.group, bot, time, bot.phase, false);
    }
    if (this.player) {
      followCamera(this.threeCamera, this.player.x, this.player.z, dt);
    }

    this.threeRenderer.render(this.threeScene, this.threeCamera);
  }

  private onResize = (): void => {
    if (!this.threeRenderer || !this.threeCamera) return;

    const { width, height } = this.scale;

    this.threeCamera.aspect = width / height;
    this.threeCamera.updateProjectionMatrix();
    this.threeRenderer.setSize(width, height);

    this.layoutHud();

    // Update touch stick position
    if (this.stickBase && this.stickKnob) {
      const baseX = 100;
      const baseY = height - 100;
      this.stickBase.setPosition(baseX, baseY);
      this.stickKnob.setPosition(baseX, baseY);
    }
  };

  private onShutdown = (): void => {
    this.scale.off('resize', this.onResize, this);
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.input.off('pointerupoutside', this.onPointerUp, this);

    this.closePanel();

    // Dispose Three.js resources
    if (this.threeScene) {
      clearAscension(this.threeScene, this.ascension);
      for (const child of [...this.threeScene.children]) disposeBlob(child);
    }
    this.ascension = null;
    disposeBlobArt();
    this.threeRenderer?.dispose();
    this.threeRenderer = null;
    this.threeScene = null;
    this.threeCamera = null;
    this.threeClock = null;

    // Remove Three.js canvas from DOM
    if (this.threeCanvas && this.threeCanvas.parentNode) {
      this.threeCanvas.parentNode.removeChild(this.threeCanvas);
    }
    this.threeCanvas = null;
  };
}