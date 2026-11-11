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
import { ensureAmbientBgm } from '../../presentation/audio/bgm';
import { playSfx } from '../../presentation/audio/sfx';

const STAGES = [
  { name: 'Purple', color: 0x8b4fd4, radius: 0.42, speed: 2.35 },
  { name: 'Blue', color: 0x1e8ef0, radius: 0.58, speed: 3.05 },
  { name: 'Green', color: 0x2fbf6e, radius: 0.77, speed: 3.85 },
  { name: 'Rock', color: 0x9a9386, radius: 0.98, speed: 4.55 },
  { name: 'Rainbow', color: 0xffffff, radius: 1.18, speed: 5.35 },
  { name: 'Angel', color: 0xfff0a8, radius: 1.35, speed: 5.9 },
] as const;

const ARENA = 34;
const BOT_COUNT = 42;

interface Bot {
  stage: number;
  radius: number;
  speed: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  tx: number;
  tz: number;
  alive: boolean;
  group: THREE.Group;
}

export class BlobEvolutionScene extends Phaser.Scene {
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
    this.createThreeScene();
    this.createPhaserUI();
    this.setupInput();
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    this.showStartPanel();
  }

  private createThreeScene(): void {
    const { width, height } = this.scale;

    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(0x07111d);
    this.threeScene.fog = new THREE.FogExp2(0x07111d, 0.015);

    this.threeCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    this.threeCamera.position.set(0, 22, 22);
    this.threeCamera.lookAt(0, 0, 0);

    this.threeRenderer = new THREE.WebGLRenderer({
      canvas: this.game.canvas as HTMLCanvasElement,
      antialias: true,
      alpha: false,
    });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.threeRenderer.shadowMap.enabled = true;
    this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.threeRenderer.toneMappingExposure = 1.1;

    this.threeClock = new THREE.Clock();

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a3a, 0.9);
    hemi.position.set(0, 30, 0);
    this.threeScene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffeedd, 1.1);
    dir.position.set(20, 40, 15);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 80;
    dir.shadow.camera.left = -45;
    dir.shadow.camera.right = 45;
    dir.shadow.camera.top = 45;
    dir.shadow.camera.bottom = -45;
    dir.shadow.bias = -0.0005;
    this.threeScene.add(dir);

    // Arena floor
    const waterTex = this.makeWaterTexture();
    waterTex.wrapS = THREE.RepeatWrapping;
    waterTex.wrapT = THREE.RepeatWrapping;
    waterTex.repeat.set(6, 6);

    const floorGeo = new THREE.PlaneGeometry(ARENA * 2, ARENA * 2, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
      map: waterTex,
      color: 0x3a9dff,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.threeScene.add(floor);

    // Boundary ring
    const ringGeo = new THREE.RingGeometry(ARENA - 0.5, ARENA + 0.5, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2a9dff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.threeScene.add(ring);
  }

  private createPhaserUI(): void {
    const { width, height } = this.scale;

    // HUD
    this.hudText = this.add
      .text(20, 20, 'BLOB EVOLUTION', {
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

    // Hint
    this.hintText = this.add
      .text(width / 2, height - 100, this.getHudHint(), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#91a9c1',
        stroke: '#071321',
        strokeThickness: 3,
        wordWrap: { width: Math.max(160, width - 140) },
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20);

    // Touch stick (hidden by default)
    this.createTouchStick();

    // Touch help text
    this.add
      .text(width - 20, height - 20, 'MOVE: STICK OR WASD  •  EAT: BUMP INTO PREY', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: 'rgba(230, 241, 255, 0.48)',
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(10);
  }

  private createTouchStick(): void {
    const { height } = this.scale;
    const baseX = 100;
    const baseY = height - 100;
    const baseRadius = 66;
    const knobRadius = 29;

    this.stickBase = this.add.graphics();
    this.stickBase.fillStyle(0x12253c, 0.55);
    this.stickBase.lineStyle(2, 0x00ffff, 0.35);
    this.stickBase.fillCircle(baseX, baseY, baseRadius);
    this.stickBase.strokeCircle(baseX, baseY, baseRadius);
    this.stickBase.setScrollFactor(0).setDepth(10).setVisible(false);

    this.stickKnob = this.add.graphics();
    this.stickKnob.fillStyle(0x00ffff, 0.88);
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
    const { width, height } = this.scale;

    const panel = this.add.container(width / 2, height / 2).setDepth(30);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f1a2e, 1);
    bg.lineStyle(2, 0x00ffff, 0.5);
    bg.fillRoundedRect(-180, -180, 360, 360, 20);
    bg.strokeRoundedRect(-180, -180, 360, 360, 20);
    panel.add(bg);

    const pill = this.add
      .text(0, -140, '3D BLOB SURVIVAL', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#00ffff',
        backgroundColor: 'rgba(0, 255, 255, 0.15)',
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5);
    panel.add(pill);

    const title = this.add
      .text(0, -80, 'Blob Evolution', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#f5e6c8',
        stroke: '#071321',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    panel.add(title);

    const blurb = this.add
      .text(0, -10, 'Start as a tiny blue blob. Eat your way through the evolution chain, grow bigger and faster, and become the one-and-only Angel.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5);
    panel.add(blurb);

    const chain = this.add
      .text(0, 60, '<b>Blue → Green → Rock → Rainbow → Angel</b>', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#f0c75e',
        align: 'center',
      })
      .setOrigin(0.5);
    panel.add(chain);

    const note = this.add
      .text(0, 100, 'On phone: drag the stick. On desktop: WASD or arrows. You can only eat the stage below you — unless you\'re Rainbow!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#8aa3b8',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5);
    panel.add(note);

    const startBtn = this.add
      .text(0, 150, 'START GAME', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#071321',
        backgroundColor: '#00ffff',
        padding: { x: 40, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => startBtn.setStyle({ backgroundColor: '#33ffff' }))
      .on('pointerout', () => startBtn.setStyle({ backgroundColor: '#00ffff' }))
      .on('pointerdown', () => startBtn.setScale(0.98))
      .on('pointerup', () => {
        startBtn.setScale(1);
        panel.destroy();
        this.startGame();
      });
    panel.add(startBtn);
  }

  private startGame(): void {
    this.duelBot = null;
    this.duelBusy = false;
    ensureAmbientBgm();
    playSfx('ui');
    this.spawnGame();
  }

  private spawnGame(): void {
    if (!this.threeScene || !this.threeRenderer) return;

    // Clear existing
    if (this.playerGroup) {
      this.threeScene.remove(this.playerGroup);
      this.disposeGroup(this.playerGroup);
    }
    for (const bot of this.bots) {
      if (bot.group) {
        this.threeScene.remove(bot.group);
        this.disposeGroup(bot.group);
      }
    }
    this.bots = [];

    // Create player
    this.player = {
      stage: 0,
      radius: STAGES[0].radius,
      speed: STAGES[0].speed,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      tx: 0,
      tz: 0,
      alive: true,
      group: this.makeBlob(0, true),
    };
    this.playerGroup = this.player.group;
    this.threeScene.add(this.playerGroup);

    // Create bots
    for (let i = 0; i < BOT_COUNT; i++) {
      this.spawnBot(i);
    }

    this.running = true;
    this.updateHud(true);
  }

  private spawnBot(index: number): void {
    if (!this.threeScene) return;

    const stage = index < 8 ? 0 : index < 20 ? 1 : index < 30 ? 2 : 3;
    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * (ARENA - 14);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const bot: Bot = {
      stage,
      radius: STAGES[stage].radius,
      speed: STAGES[stage].speed,
      x,
      z,
      vx: 0,
      vz: 0,
      tx: x + (Math.random() - 0.5) * 10,
      tz: z + (Math.random() - 0.5) * 10,
      alive: true,
      group: this.makeBlob(stage),
    };

    this.threeScene.add(bot.group);
    this.bots.push(bot);
  }

  private makeBlob(stage: number, isPlayer = false): THREE.Group {
    const group = new THREE.Group();
    const data = STAGES[stage];

    // Body
    const bodyGeo = new THREE.SphereGeometry(data.radius, 32, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: stage === 4 ? 0.05 : stage === 5 ? 0.0 : 0.35,
      metalness: stage === 4 ? 0.85 : stage === 5 ? 1.0 : 0.15,
      emissive: stage === 5 ? new THREE.Color(0xfff0a8) : stage === 4 ? new THREE.Color(data.color) : new THREE.Color(0x000000),
      emissiveIntensity: stage === 5 ? 0.4 : stage === 4 ? 0.35 : 0,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Eyes for player
    if (isPlayer) {
      const eyeGeo = new THREE.SphereGeometry(data.radius * 0.12, 12, 12);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x071321 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-data.radius * 0.35, data.radius * 0.15, data.radius * 0.85);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(data.radius * 0.35, data.radius * 0.15, data.radius * 0.85);
      group.add(leftEye, rightEye);
    }

    // Rainbow texture for stage 4
    if (stage === 4) {
      const rainbowTex = this.makeRainbowTexture();
      bodyMat.map = rainbowTex;
      bodyMat.needsUpdate = true;
    }

    // Angel effects for stage 5
    if (stage === 5) {
      // Halo
      const haloGeo = new THREE.RingGeometry(data.radius * 1.3, data.radius * 1.6, 64);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xfff0a8,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = data.radius * 1.6;
      group.add(halo);

      // Wings (simple planes)
      for (let w = -1; w <= 1; w += 2) {
        const wingGeo = new THREE.PlaneGeometry(data.radius * 1.2, data.radius * 1.5);
        const wingMat = new THREE.MeshBasicMaterial({
          color: 0xfff0a8,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(w * data.radius * 0.7, data.radius * 0.4, -data.radius * 0.2);
        wing.rotation.y = w * 0.5;
        group.add(wing);
      }
    }

    return group;
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }

  private makeRainbowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const stops: [number, string][] = [
      [0, '#ff1a1a'],
      [1 / 6, '#ff8a1a'],
      [2 / 6, '#ffe01a'],
      [3 / 6, '#2adf4a'],
      [4 / 6, '#1a8cff'],
      [5 / 6, '#7a3dff'],
      [1, '#ff1ad6'],
    ];
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    stops.forEach(([t, c]) => g.addColorStop(t, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const v = ctx.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, 'rgba(255,255,255,.22)');
    v.addColorStop(0.5, 'rgba(255,255,255,0)');
    v.addColorStop(1, 'rgba(0,0,0,.18)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  private makeWaterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(110, 90, 20, 128, 128, 160);
    g.addColorStop(0, '#8fd6ff');
    g.addColorStop(0.45, '#2a9dff');
    g.addColorStop(1, '#0d5fb8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 4 + Math.random() * 16;
      const bubble = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, 1, x, y, r);
      bubble.addColorStop(0, 'rgba(255,255,255,.55)');
      bubble.addColorStop(0.55, 'rgba(180,230,255,.18)');
      bubble.addColorStop(1, 'rgba(20,80,160,0)');
      ctx.fillStyle = bubble;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private distance(a: Bot, b: Bot): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.hypot(dx, dz);
  }

  private canEat(eaterStage: number, preyStage: number): boolean {
    if (eaterStage === 4 && preyStage < 4) return true; // Rainbow eats all below
    if (eaterStage === 5) return true; // Angel eats everything
    return eaterStage > preyStage; // Normal: only eat strictly lower stage
  }

  private playerEat(bot: Bot): void {
    if (!this.player || !this.threeScene) return;

    this.threeScene.remove(bot.group);
    this.disposeGroup(bot.group);
    bot.alive = false;
    playSfx('gather');

    if (this.player.stage < 4) {
      this.player.stage++;
      this.player.radius = STAGES[this.player.stage].radius;
      this.player.speed = STAGES[this.player.stage].speed;
      this.threeScene.remove(this.playerGroup!);
      this.disposeGroup(this.playerGroup!);
      this.playerGroup = this.makeBlob(this.player.stage, true);
      this.threeScene.add(this.playerGroup);
      playSfx('build');
    }

    this.updateHud(true);
  }

  private loseGame(): void {
    this.running = false;
    playSfx('defeat');
    this.showEndPanel('You were eaten!', 'The arena has a new champion.');
  }

  private checkVictory(): void {
    const aliveBots = this.bots.filter((b) => b.alive);
    if (aliveBots.length === 0 && this.player?.stage === 5) {
      this.running = false;
      playSfx('victory');
      this.showEndPanel('You became the Angel!', 'You have ascended. The arena is yours.');
    }
  }

  private showEndPanel(titleText: string, copyText: string): void {
    const { width, height } = this.scale;

    const panel = this.add.container(width / 2, height / 2).setDepth(30);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f1a2e, 1);
    bg.lineStyle(2, titleText.includes('Angel') ? 0xffdb72 : 0xff4444, 0.5);
    bg.fillRoundedRect(-180, -180, 360, 360, 20);
    bg.strokeRoundedRect(-180, -180, 360, 360, 20);
    panel.add(bg);

    const pill = this.add
      .text(0, -140, titleText.includes('Angel') ? 'ASCENDED' : 'GAME OVER', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: titleText.includes('Angel') ? '#ffdb72' : '#ff4444',
        backgroundColor: titleText.includes('Angel') ? 'rgba(255, 219, 114, 0.15)' : 'rgba(255, 68, 68, 0.15)',
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5);
    panel.add(pill);

    const title = this.add
      .text(0, -80, titleText, {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#f5e6c8',
        stroke: '#071321',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    panel.add(title);

    const copy = this.add
      .text(0, -10, copyText, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5);
    panel.add(copy);

    const restartBtn = this.add
      .text(0, 80, 'PLAY AGAIN', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#071321',
        backgroundColor: '#00ffff',
        padding: { x: 40, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setStyle({ backgroundColor: '#33ffff' }))
      .on('pointerout', () => restartBtn.setStyle({ backgroundColor: '#00ffff' }))
      .on('pointerdown', () => restartBtn.setScale(0.98))
      .on('pointerup', () => {
        restartBtn.setScale(1);
        panel.destroy();
        this.startGame();
      });
    panel.add(restartBtn);
  }

  private updatePlayer(dt: number): void {
    if (!this.player || !this.player.alive) return;

    const input = this.getMoveDirection();
    const speed = this.player.speed * dt * 8;

    this.player.vx += input.x * speed;
    this.player.vz += input.z * speed;

    // Damping
    this.player.vx *= 0.92;
    this.player.vz *= 0.92;

    // Apply velocity
    this.player.x += this.player.vx;
    this.player.z += this.player.vz;

    // Boundary clamp
    const lim = ARENA - this.player.radius * 0.8;
    this.player.x = Phaser.Math.Clamp(this.player.x, -lim, lim);
    this.player.z = Phaser.Math.Clamp(this.player.z, -lim, lim);

    // Update Three.js position
    if (this.playerGroup) {
      this.playerGroup.position.set(this.player.x, this.player.radius, this.player.z);
    }

    // Camera follow
    if (this.threeCamera) {
      this.threeCamera.position.x = Phaser.Math.Linear(this.threeCamera.position.x, this.player.x, 0.08);
      this.threeCamera.position.z = Phaser.Math.Linear(this.threeCamera.position.z, this.player.z + 22, 0.08);
      this.threeCamera.lookAt(this.player.x, 0, this.player.z);
    }
  }

  private updateBots(dt: number): void {
    for (const bot of this.bots) {
      if (!bot.alive) continue;

      // Simple AI: wander + seek player if close
      if (Math.random() < 0.01) {
        bot.tx = bot.x + (Math.random() - 0.5) * 20;
        bot.tz = bot.z + (Math.random() - 0.5) * 20;
        const lim = ARENA - bot.radius * 0.8;
        bot.tx = Phaser.Math.Clamp(bot.tx, -lim, lim);
        bot.tz = Phaser.Math.Clamp(bot.tz, -lim, lim);
      }

      if (this.player) {
        const d = this.distance(bot, this.player);
        if (d < 25) {
          const dx = this.player.x - bot.x;
          const dz = this.player.z - bot.z;
          const dist = Math.hypot(dx, dz) || 1;
          bot.tx = bot.x + (dx / dist) * 8;
          bot.tz = bot.z + (dz / dist) * 8;
        }
      }

      const dx = bot.tx - bot.x;
      const dz = bot.tz - bot.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.5) {
        bot.vx += (dx / dist) * bot.speed * dt * 5;
        bot.vz += (dz / dist) * bot.speed * dt * 5;
      }

      bot.vx *= 0.9;
      bot.vz *= 0.9;

      bot.x += bot.vx;
      bot.z += bot.vz;

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

      if (bot.group) {
        bot.group.position.set(bot.x, bot.radius, bot.z);
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

    this.threeScene.remove(prey.group);
    this.disposeGroup(prey.group);
    prey.alive = false;
    playSfx('gather');

    if (eater.stage < 4) {
      eater.stage++;
      eater.radius = STAGES[eater.stage].radius;
      eater.speed = STAGES[eater.stage].speed;
      this.threeScene.remove(eater.group);
      this.disposeGroup(eater.group);
      eater.group = this.makeBlob(eater.stage);
      this.threeScene.add(eater.group);
      playSfx('build');
    }
  }

  private showRPS(opponent: Bot): void {
    this.duelBot = opponent;
    this.duelBusy = true;
    this.running = false;
    playSfx('alert');

    const { width, height } = this.scale;

    const panel = this.add.container(width / 2, height / 2).setDepth(30);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f1a2e, 1);
    bg.lineStyle(2, 0xffdb72, 0.5);
    bg.fillRoundedRect(-180, -180, 360, 360, 20);
    bg.strokeRoundedRect(-180, -180, 360, 360, 20);
    panel.add(bg);

    const pill = this.add
      .text(0, -140, 'RAINBOW SHOWDOWN', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffdb72',
        backgroundColor: 'rgba(255, 219, 114, 0.15)',
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5);
    panel.add(pill);

    const title = this.add
      .text(0, -80, 'Rock Paper Scissors', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#f5e6c8',
        stroke: '#071321',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    panel.add(title);

    const copy = this.add
      .text(0, -10, 'Another Rainbow blob! Choose secretly. Your opponent has already made its hidden choice.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#b8c9d9',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5);
    panel.add(copy);

    const choices = ['rock', 'paper', 'scissors'] as const;
    const opponentChoice = choices[Math.floor(Math.random() * 3)];

    choices.forEach((choice, i) => {
      const btn = this.add
        .text(-100 + i * 100, 60, choice === 'rock' ? '✊ Rock' : choice === 'paper' ? '✋ Paper' : '✌️ Scissors', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#071321',
          backgroundColor: '#ffdb72',
          padding: { x: 20, y: 12 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => btn.setStyle({ backgroundColor: '#ffe072' }))
        .on('pointerout', () => btn.setStyle({ backgroundColor: '#ffdb72' }))
        .on('pointerdown', () => btn.setScale(0.98))
        .on('pointerup', () => {
          this.resolveRPS(choice, opponentChoice, panel);
        });
      panel.add(btn);
    });
  }

  private resolveRPS(playerChoice: 'rock' | 'paper' | 'scissors', opponentChoice: 'rock' | 'paper' | 'scissors', panel: Phaser.GameObjects.Container): void {
    const result = this.getRPSResult(playerChoice, opponentChoice);

    if (result === 'tie') {
      // Tie - choose again
      this.showRPS(this.duelBot!);
      panel.destroy();
      return;
    }

    if (result === 'win') {
      // Player wins - eat opponent
      if (this.duelBot) {
        this.playerEat(this.duelBot);
      }
      this.duelBot = null;
      this.duelBusy = false;
      this.running = true;
      panel.destroy();
    } else {
      // Player loses - eaten
      this.loseGame();
      panel.destroy();
    }
  }

  private getRPSResult(player: 'rock' | 'paper' | 'scissors', opponent: 'rock' | 'paper' | 'scissors'): 'win' | 'lose' | 'tie' {
    if (player === opponent) return 'tie';
    if (
      (player === 'rock' && opponent === 'scissors') ||
      (player === 'paper' && opponent === 'rock') ||
      (player === 'scissors' && opponent === 'paper')
    ) {
      return 'win';
    }
    return 'lose';
  }

  private updateHud(force = false): void {
    if (!this.hudText || !this.player || !this.running) return;

    const now = performance.now();
    if (!force && now - this.lastHud < 100) return;
    this.lastHud = now;

    const remaining = this.bots.filter((b) => b.alive).length;
    const stage = this.player.stage;
    const radius = this.player.radius;
    const speed = this.player.speed;

    const stageNames = ['Purple', 'Blue', 'Green', 'Rock', 'Rainbow', 'Angel'];
    const hudLine = `Stage: ${stageNames[stage]} (${radius.toFixed(2)})  Speed: ${speed.toFixed(2)}  Remaining: ${remaining}`;

    this.hudText.setText(hudLine);

    if (stage === 4) {
      this.hudText.setColor('#ffdb72');
    } else if (stage === 3) {
      this.hudText.setColor('#d8d0c4');
    } else if (stage === 2) {
      this.hudText.setColor('#8df4bc');
    } else {
      this.hudText.setColor('#b8e3ff');
    }
  }

  private getHudHint(): string {
    return 'MOVE: STICK OR WASD  •  EAT: BUMP INTO PREY';
  }

  update(_time: number, delta: number): void {
    if (!this.running || !this.player || !this.threeRenderer || !this.threeScene || !this.threeCamera || !this.threeClock) return;

    const dt = Math.min(delta / 1000, 0.04);

    this.updatePlayer(dt);
    this.updateBots(dt);
    this.resolveCollisions();
    this.updateHud();

    // Render Three.js scene
    this.threeRenderer.render(this.threeScene, this.threeCamera);
  }

  private onResize = (): void => {
    if (!this.threeRenderer || !this.threeCamera) return;

    const { width, height } = this.scale;

    this.threeCamera.aspect = width / height;
    this.threeCamera.updateProjectionMatrix();
    this.threeRenderer.setSize(width, height);

    // Update hint text wrap width
    this.hintText?.setWordWrapWidth(Math.max(160, width - 140));

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

    // Dispose Three.js resources
    if (this.threeScene) {
      this.threeScene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
    }
    this.threeRenderer?.dispose();
    this.threeRenderer = null;
    this.threeScene = null;
    this.threeCamera = null;
    this.threeClock = null;
  };
}