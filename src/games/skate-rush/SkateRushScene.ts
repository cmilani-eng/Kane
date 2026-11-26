/**
 * Skate Rush 3 — the Phaser scene.
 * The rules live in skateRules.ts (pure, tested), the original cartoon artwork in skateArt.ts
 * (drawn on a 2D canvas and shown here as a texture), saved progress in skateStore.ts, and the
 * menu / shop / game-over boxes are the shared game panels. This file only wires them together:
 * input, a fixed 60 Hz step so the game plays the same on any screen, the HUD and the phases.
 *
 * Called by: src/games/skate-rush/index.ts (registry), src/main.ts
 */
import Phaser from 'phaser';
import { t, type MessageKey } from '../../i18n';
import { playSfx } from '../../presentation/audio/sfx';
import { GamePanel, type GamePanelSpec, createBackPill } from '../../presentation/ui/gamePanel';
import { HUB_FONT } from '../../presentation/ui/hubCardArt';
import { drawFrame } from './skateArt';
import {
  BOARD_IDS,
  BOARD_PRICES,
  SKATERS,
  SKATER_IDS,
  TICK,
  VIEW_H,
  VIEW_W,
  WORLDS,
  createRun,
  jump,
  stepRun,
  type BoardId,
  type Run,
  type RunEvent,
  type SkaterId,
  type World,
} from './skateRules';
import { emptyProgress, finishRun, loadProgress, purchase, saveProgress, type Progress } from './skateStore';

const COVER_KEY = 'skate-rush-cover';
const FRAME_KEY = 'skate-rush-frame';
/** Room above the game for the "← Games" pill. */
const TOP_BAR = 52;
/** After a long stall (a background tab), catch up at most this many steps instead of spiralling. */
const MAX_STEPS_PER_FRAME = 6;
const PAGE_COLOR = 0x0b1225;

const CHAR_KEYS: Record<SkaterId, MessageKey> = {
  cyan: 'skate.char.cyan',
  pink: 'skate.char.pink',
  lime: 'skate.char.lime',
  gold: 'skate.char.gold',
};
const BOARD_KEYS: Record<BoardId, MessageKey> = {
  basic: 'skate.board.basic',
  speed: 'skate.board.speed',
  jump: 'skate.board.jump',
  magnet: 'skate.board.magnet',
};
const WORLD_KEYS: Record<World['id'], MessageKey> = {
  city: 'skate.world.city',
  desert: 'skate.world.desert',
  jungle: 'skate.world.jungle',
  space: 'skate.world.space',
};

type Phase = 'menu' | 'shop' | 'playing' | 'over';

const dprOf = (): number => Math.min(window.devicePixelRatio || 1, 2);

export class SkateRushScene extends Phaser.Scene {
  private phase: Phase = 'menu';
  private progress: Progress = emptyProgress();
  private skater: SkaterId = 'cyan';
  private board: BoardId = 'basic';
  private run: Run | null = null;
  /** Time not yet spent on fixed steps, in seconds. */
  private acc = 0;

  private ctx2d: CanvasRenderingContext2D | null = null;
  private frameTexture: Phaser.Textures.CanvasTexture | null = null;
  private frameImage: Phaser.GameObjects.Image | null = null;
  private cover: Phaser.GameObjects.Image | null = null;
  private hud: Phaser.GameObjects.Text[] = [];
  private jumpKey: Phaser.GameObjects.Container | null = null;
  private panel: GamePanel | null = null;
  private stage = { x: 0, y: 0, w: VIEW_W, h: VIEW_H };
  private lastHud = '';

  constructor() {
    super('SkateRush');
  }

  preload(): void {
    // The cover is a nicety: if it fails to load, the menu simply shows the plain page colour.
    if (!this.textures.exists(COVER_KEY)) {
      this.load.image(COVER_KEY, `${import.meta.env.BASE_URL}covers/skate-rush.jpg`);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PAGE_COLOR);
    this.progress = loadProgress();
    this.phase = 'menu';
    this.run = null;
    this.acc = 0;
    this.lastHud = '';

    this.buildStage();
    createBackPill(this, `← ${t('hub.title')}`, () => this.scene.start('GamePicker'));

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.keyboard?.on('keydown', this.onKeyDown, this);
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    this.layout();
    this.showMenu();
  }

  // ---------------------------------------------------------------- stage

  private buildStage(): void {
    const canvas = document.createElement('canvas');
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    this.ctx2d = canvas.getContext('2d');
    if (!this.ctx2d) throw new Error('2D canvas is not available');

    if (this.textures.exists(FRAME_KEY)) this.textures.remove(FRAME_KEY);
    this.frameTexture = this.textures.addCanvas(FRAME_KEY, canvas);
    this.frameImage = this.add.image(0, 0, FRAME_KEY).setDepth(1).setVisible(false);
    if (this.textures.exists(COVER_KEY)) this.cover = this.add.image(0, 0, COVER_KEY).setDepth(0);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: HUB_FONT,
      fontSize: '15px',
      fontStyle: '900',
      color: '#eef5ff',
    };
    this.hud = [0, 1, 2, 3].map(() =>
      this.add.text(0, 0, '', style).setDepth(10).setShadow(0, 2, '#000000', 5, true, true).setResolution(dprOf()).setVisible(false),
    );

    // A picture of the JUMP key. Taps are handled for the whole screen, so it needs no hit area of its own.
    const face = this.add.graphics();
    face.fillStyle(0x2563eb, 0.92);
    face.fillRoundedRect(-56, -24, 112, 48, 12);
    const label = this.add
      .text(0, 0, t('skate.jump'), { fontFamily: HUB_FONT, fontSize: '16px', fontStyle: '900', color: '#ffffff' })
      .setOrigin(0.5)
      .setResolution(dprOf());
    this.jumpKey = this.add.container(0, 0, [face, label]).setDepth(20).setVisible(false);
  }

  private readonly layout = (): void => {
    const { width: vw, height: vh } = this.scale;
    if (vw < 1 || vh < 1 || !this.frameImage) return;
    const availH = Math.max(1, vh - TOP_BAR - 8);
    const scale = Math.min(vw / VIEW_W, availH / VIEW_H);
    const w = VIEW_W * scale;
    const h = VIEW_H * scale;
    const cx = vw / 2;
    const cy = TOP_BAR + availH / 2;
    this.stage = { x: cx - w / 2, y: cy - h / 2, w, h };
    this.frameImage.setPosition(cx, cy).setDisplaySize(w, h);

    if (this.cover) {
      const k = Math.max(vw / this.cover.width, vh / this.cover.height);
      this.cover.setPosition(vw / 2, vh / 2).setScale(k);
    }
    this.jumpKey?.setPosition(vw - 16 - 56, vh - 16 - 24);

    const size = `${Math.round(Math.min(15, Math.max(11, vw * 0.018)))}px`;
    for (const text of this.hud) text.setFontSize(size);
    this.layoutHud();
  };

  /** Spread the four readouts across the top of the game, like the original's flex row. */
  private layoutHud(): void {
    const { x, y, w } = this.stage;
    const total = this.hud.reduce((sum, text) => sum + text.width, 0);
    const gap = Math.max(6, (w - 26 - total) / 3);
    let cursor = x + 13;
    for (const text of this.hud) {
      text.setPosition(cursor, y + 10);
      cursor += text.width + gap;
    }
  }

  private setStageVisible(on: boolean): void {
    this.frameImage?.setVisible(on);
    this.cover?.setVisible(!on);
    for (const text of this.hud) text.setVisible(on);
    this.jumpKey?.setVisible(on);
  }

  // ---------------------------------------------------------------- input

  private readonly onPointerDown = (_pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void => {
    // A tap on a button (the "← Games" pill) is that button's, not a jump.
    if (this.phase === 'playing' && over.length === 0) this.doJump();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== 'Space' && event.code !== 'ArrowUp') return;
    event.preventDefault();
    if (event.repeat) return; // holding the key would otherwise use up both jumps at once, fatal under a low ceiling
    if (this.phase === 'menu') this.startRun();
    else if (this.phase === 'playing') this.doJump();
  };

  private doJump(): void {
    if (this.run && jump(this.run, Math.random)) playSfx('ui');
  }

  // ---------------------------------------------------------------- the run

  private startRun(): void {
    this.closePanel();
    if (!this.progress.owned.includes(this.board)) this.board = 'basic';
    this.run = createRun(this.board);
    this.phase = 'playing';
    this.acc = 0;
    this.lastHud = '';
    this.setStageVisible(true);
    this.render(this.run);
  }

  update(_time: number, delta: number): void {
    const run = this.run;
    if (this.phase !== 'playing' || !run) return;

    // Fixed 1/60 s steps, as many as the elapsed time asks for, so a 144 Hz screen is not 2.4x faster.
    this.acc += Math.min(delta, 100) / 1000;
    let done = 0;
    while (this.acc >= TICK && done < MAX_STEPS_PER_FRAME) {
      this.acc -= TICK;
      done++;
      this.playEventSounds(stepRun(run, Math.random));
      if (run.over) break;
    }
    if (done === MAX_STEPS_PER_FRAME) this.acc = 0;

    this.render(run);
    if (run.over) this.endRun(run);
  }

  private playEventSounds(events: RunEvent[]): void {
    for (const event of events) {
      if (event === 'coin') playSfx('gather');
      else if (event === 'power') playSfx('ability');
      else if (event === 'shield-hit') playSfx('alert');
      else playSfx('defeat');
    }
  }

  private render(run: Run): void {
    if (!this.ctx2d) return;
    drawFrame(this.ctx2d, run, this.skater);
    this.frameTexture?.refresh();

    const world = WORLDS[run.worldIndex];
    const parts = [
      `${world.emoji} ${t(WORLD_KEYS[world.id])}`,
      `${t('skate.score')} ${Math.floor(run.score)}`,
      `🪙 ${run.runCoins}`,
      `❤️ ${run.shield ? '🛡️' : '1'}`,
    ];
    const key = parts.join('|');
    if (key === this.lastHud) return;
    this.lastHud = key;
    parts.forEach((part, i) => this.hud[i]?.setText(part));
    this.layoutHud();
  }

  private endRun(run: Run): void {
    this.progress = finishRun(this.progress, { score: run.score, coins: run.runCoins, skater: this.skater });
    saveProgress(this.progress);
    this.phase = 'over';
    this.jumpKey?.setVisible(false);
    this.openPanel({
      pill: t('skate.over.pill'),
      title: t('skate.over.title'),
      copy: t('skate.over.stats', { score: Math.floor(run.score), coins: run.runCoins, wallet: this.progress.coins }),
      chain: this.leaderText(),
      buttons: [
        { label: t('skate.again'), primary: true, onClick: () => this.startRun() },
        { label: t('skate.menu'), onClick: () => this.showMenu() },
      ],
    });
  }

  private leaderText(): string {
    const top = this.progress.leaders.slice(0, 5);
    if (top.length === 0) return `${t('skate.top')}\n${t('skate.noScores')}`;
    return `${t('skate.top')}\n${top.map((l, i) => `${i + 1}. ${l.name} — ${l.score}`).join('\n')}`;
  }

  // ---------------------------------------------------------------- panels

  private openPanel(spec: GamePanelSpec): void {
    this.closePanel();
    this.panel = new GamePanel(this, spec);
  }

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = null;
  }

  private showMenu(): void {
    this.phase = 'menu';
    this.run = null;
    if (!this.progress.owned.includes(this.board)) this.board = 'basic';
    this.setStageVisible(false);
    this.openPanel(this.menuSpec());
  }

  private menuSpec(): GamePanelSpec {
    const best = this.progress.leaders[0]?.score;
    return {
      pill: t('skate.pill'),
      title: 'Skate Rush 3',
      copy: t('skate.copy'),
      chain: `${t(CHAR_KEYS[this.skater])} · ${t(BOARD_KEYS[this.board])}`,
      result:
        best === undefined
          ? t('skate.wallet', { n: this.progress.coins })
          : t('skate.walletBest', { coins: this.progress.coins, best }),
      note: t('skate.controls'),
      buttons: [
        { label: `${t('skate.skater')}: ${SKATERS[this.skater].name} ›`, onClick: () => this.cycleSkater() },
        { label: `${t('skate.board')}: ${t(BOARD_KEYS[this.board])} ›`, onClick: () => this.cycleBoard() },
        { label: t('skate.start'), primary: true, onClick: () => this.startRun() },
        { label: t('skate.upgrades'), onClick: () => this.showShop() },
      ],
    };
  }

  private cycleSkater(): void {
    this.skater = SKATER_IDS[(SKATER_IDS.indexOf(this.skater) + 1) % SKATER_IDS.length];
    this.panel?.update(this.menuSpec());
  }

  /** Only decks the player owns can be picked; the shop is where the others are bought. */
  private cycleBoard(): void {
    const owned = BOARD_IDS.filter((b) => this.progress.owned.includes(b));
    this.board = owned[(owned.indexOf(this.board) + 1) % owned.length];
    this.panel?.update(this.menuSpec());
  }

  private showShop(message?: string): void {
    this.phase = 'shop';
    const spec = this.shopSpec(message);
    if (this.panel) this.panel.update(spec);
    else this.openPanel(spec);
  }

  private shopSpec(message?: string): GamePanelSpec {
    const decks = BOARD_IDS.filter((b) => b !== 'basic');
    return {
      pill: t('skate.shop.pill'),
      title: t('skate.shop.title'),
      copy: t('skate.shop.copy'),
      // The shop reuses the menu's open panel, so lines only the menu has must be cleared explicitly.
      chain: undefined,
      note: undefined,
      result: message ?? t('skate.wallet', { n: this.progress.coins }),
      buttons: [
        ...decks.map((id) => ({
          label: this.progress.owned.includes(id)
            ? t('skate.shop.equip', { name: t(BOARD_KEYS[id]) })
            : t('skate.shop.buy', { name: t(BOARD_KEYS[id]), price: BOARD_PRICES[id] }),
          onClick: () => this.shopTap(id),
        })),
        // Enter goes back, never buys.
        { label: t('skate.back'), primary: true, onClick: () => this.showMenu() },
      ],
    };
  }

  private shopTap(id: BoardId): void {
    const { progress, result } = purchase(this.progress, id);
    if (result === 'short') {
      this.panel?.update({ result: t('skate.shop.short') });
      return;
    }
    this.progress = progress;
    saveProgress(progress);
    this.board = id;
    this.showShop(result === 'bought' ? t('skate.shop.bought') : t('skate.shop.equipped'));
  }

  // ---------------------------------------------------------------- teardown

  private onShutdown = (): void => {
    this.scale.off('resize', this.layout, this);
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.keyboard?.off('keydown', this.onKeyDown, this);
    this.closePanel();
    if (this.textures.exists(FRAME_KEY)) this.textures.remove(FRAME_KEY);
    this.frameTexture = null;
    this.frameImage = null;
    this.cover = null;
    this.ctx2d = null;
    this.jumpKey = null;
    this.hud = [];
    this.run = null;
  };
}
