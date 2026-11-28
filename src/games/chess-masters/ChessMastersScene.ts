/**
 * Chess Masters — the Phaser scene. The rules live in chessRules.ts and chessMatch.ts (pure,
 * tested), the computer in chessAi.ts (run in a Web Worker), taps in chessSelection.ts, the
 * boxes before a game in chessMenus.ts, the wording in chessText.ts, the drawing in
 * chessArt.ts and chessHud.ts, and saved progress in chessStore.ts. This file wires them
 * together: turns, the clock, the screen and the end of a game.
 *
 * Called by: src/games/chess-masters/index.ts (registry), src/main.ts
 */
import Phaser from 'phaser';
import { isReduceMotion } from '../../database/motionPrefs';
import { t } from '../../i18n';
import { playSfx } from '../../presentation/audio/sfx';
import { GamePanel, createBackPill, type GamePanelSpec } from '../../presentation/ui/gamePanel';
import { STRENGTH, type AiSettings } from './chessAi';
import { AiClient } from './chessAiClient';
import { drawBoard } from './chessArt';
import { createClock, flaggedColor, formatClock, pressClock, stopClock, tickClock, type Clock } from './chessClock';
import { BLACK, PAWN, POWER_KINDS, WHITE, otherColor, type Action, type Color, type PowerKind } from './chessCore';
import { ChessHud, ensureIconTextures, type CardView, type ClockView, type HudView, type TrayView } from './chessHud';
import { chessLayout, squareFromPoint, type ChessLayout } from './chessLayout';
import { createMatch, flagFall, playAction, resign, type Match, type TurnReport } from './chessMatch';
import { ChessMenus, freshSetup, type GameSetup } from './chessMenus';
import { helpPages, helpPanel, overPanel, pausePanel, promotePanel } from './chessPanels';
import { isInCheck, legalActions } from './chessRules';
import { noChoice, pressBoard, releaseBoard, tapPower, type Choice, type Press } from './chessSelection';
import { emptyProgress, finishGame, loadProgress, saveProgress, type Progress } from './chessStore';
import {
  describeSquare,
  endReason,
  endTitle,
  eventText,
  infoText,
  modeName,
  playerName,
  powerName,
  statusLines,
  upgradeSides,
} from './chessText';
import { maskOf } from './chessUpgrades';

const BOARD_KEY = 'chess-masters-board';
const COVER_KEY = 'chess-masters-cover';
const PAGE_COLOR = 0x0b1225;
const SLIDE_MS = 190;
/** The computer never answers faster than this, so its move can be followed. */
const REPLY_DELAY_MS = 550;
const BLITZ_REPLY_DELAY_MS = 220;

/** `menu` covers every box shown before a game; the rest belong to a game on the board. */
type Screen = 'menu' | 'playing' | 'promote' | 'pause' | 'help' | 'over' | 'review';

const randomSeed = (): number => Math.floor(Math.random() * 2 ** 31);
const dprOf = (): number => Math.min(window.devicePixelRatio || 1, 2);

export class ChessMastersScene extends Phaser.Scene {
  private screen: Screen = 'menu';
  private progress: Progress = emptyProgress();
  private setup: GameSetup = freshSetup();
  private match: Match | null = null;
  private clock: Clock | null = null;
  private lastTick = 0;

  private choice: Choice = noChoice();
  private press: Press | null = null;
  /** What the last action did. */
  private event = '';
  private flipped = false;
  private thinking = false;
  private slide: { from: number; to: number; started: number } | null = null;
  /** Goes up with every new game, so a late answer for an old one is ignored. */
  private gameNumber = 0;
  private earned: { earned: number; total: number } | undefined;
  private recorded = false;

  private menus: ChessMenus | null = null;
  private panel: GamePanel | null = null;
  private hud: ChessHud | null = null;
  private ai: AiClient | null = null;
  private replyTimer: number | null = null;
  private board: ChessLayout | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private boardTexture: Phaser.Textures.CanvasTexture | null = null;
  private boardImage: Phaser.GameObjects.Image | null = null;
  private cover: Phaser.GameObjects.Image | null = null;

  constructor() {
    super('ChessMasters');
  }

  preload(): void {
    // The cover is a nicety: if it fails to load, the menus show the plain page colour.
    if (!this.textures.exists(COVER_KEY)) {
      this.load.svg(COVER_KEY, `${import.meta.env.BASE_URL}covers/chess-masters.svg`, { width: 1290, height: 774 });
    }
  }

  create(): void {
    // Phaser reuses this object each time the scene starts, so everything is reset here.
    this.screen = 'menu';
    this.setup = freshSetup();
    this.match = null;
    this.clock = null;
    this.resetBoardState();
    this.gameNumber++;
    this.progress = loadProgress();

    this.cameras.main.setBackgroundColor(PAGE_COLOR);
    if (this.textures.exists(COVER_KEY)) this.cover = this.add.image(0, 0, COVER_KEY).setDepth(0).setAlpha(0.5);
    ensureIconTextures(this);
    this.canvas = document.createElement('canvas');
    this.canvas.width = 8;
    this.canvas.height = 8;
    this.remakeBoardTexture();
    this.boardImage = this.add.image(0, 0, BOARD_KEY).setDepth(1).setVisible(false);
    this.hud = new ChessHud(this);
    this.ai = new AiClient();
    this.menus = new ChessMenus({
      progress: () => this.progress,
      remember: (change) => this.remember(change),
      open: (spec) => this.openPanel(spec),
      start: (setup) => this.beginGame(setup),
      sound: (kind) => playSfx(kind),
      seed: randomSeed,
    });
    createBackPill(this, `← ${t('hub.title')}`, () => this.scene.start('GamePicker'));

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.keyboard?.on('keydown-ESC', this.onEscape, this);
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    this.layout();
    this.showModes();
  }

  private resetBoardState(): void {
    this.choice = noChoice();
    this.press = null;
    this.event = '';
    this.flipped = false;
    this.thinking = false;
    this.slide = null;
    this.earned = undefined;
    this.recorded = false;
  }

  private remember(change: Partial<Progress>): void {
    this.progress = { ...this.progress, ...change };
    saveProgress(this.progress);
  }

  private showModes(): void {
    this.leaveGame();
    this.menus?.modes();
  }

  // ---------------------------------------------------------------- game flow

  private beginGame(setup: GameSetup): void {
    this.stopComputer();
    this.closePanel();
    this.gameNumber++;
    this.resetBoardState();
    this.setup = setup;
    const [white, black] = setup.upgrades;
    this.match = createMatch({ mode: setup.mode, upgrades: [maskOf(white), maskOf(black)], seed: randomSeed() });
    this.clock = setup.mode === 'blitz' ? createClock(this.progress.blitz) : null;
    this.lastTick = performance.now();
    this.flipped = setup.vsComputer && setup.human === BLACK;
    this.screen = 'playing';
    this.layout();
    this.continueTurn();
  }

  private leaveGame(): void {
    this.stopComputer();
    this.gameNumber++;
    this.screen = 'menu';
    this.match = null;
    this.clock = null;
    this.resetBoardState();
    this.layout();
  }

  private playAgain(): void {
    this.leaveGame();
    this.menus?.again(this.setup);
  }

  private humanTurn(): boolean {
    const match = this.match;
    return !!match && !match.outcome && (!this.setup.vsComputer || match.pos.turn === this.setup.human);
  }

  private canAct(): boolean {
    return this.screen === 'playing' && !this.thinking && !this.slide && this.humanTurn();
  }

  private continueTurn(): void {
    if (this.screen !== 'playing' || !this.match || this.slide) return;
    if (this.match.outcome) this.finish();
    else if (!this.humanTurn()) this.askComputer();
    else this.render();
  }

  private askComputer(): void {
    const { match, ai } = this;
    if (!match || !ai || this.thinking) return;
    this.thinking = true;
    this.render();
    const game = this.gameNumber;
    const asked = performance.now();
    const settings: AiSettings = { level: this.setup.level, seed: randomSeed() };
    if (this.clock) {
      // Spend the clock sensibly: a slice of what is left, plus most of the increment.
      const slice = this.clock.remaining[match.pos.turn] / 30 + this.clock.increment * 0.6;
      settings.timeMs = Math.max(80, Math.min(STRENGTH[this.setup.level].timeMs, slice));
    }
    // The clock builds a new match when it runs out, which makes this question stale.
    const current = (): boolean => game === this.gameNumber && this.thinking && this.match === match;
    void ai.think({ pos: match.pos, seen: match.seen, powerUps: match.mode === 'powerup' }, settings).then((reply) => {
      if (!current()) return;
      const delay = this.clock ? BLITZ_REPLY_DELAY_MS : REPLY_DELAY_MS;
      this.replyTimer = window.setTimeout(() => {
        this.replyTimer = null;
        if (!current()) return;
        this.thinking = false;
        if (reply && this.perform(reply.action)) return;
        // Never expected, but the game must not stall: any legal action will do.
        const fallback = legalActions(match.pos)[0];
        if (fallback) this.perform(fallback);
      }, Math.max(0, delay - (performance.now() - asked)));
    });
  }

  private stopComputer(): void {
    this.ai?.cancel();
    if (this.replyTimer !== null) window.clearTimeout(this.replyTimer);
    this.replyTimer = null;
    this.thinking = false;
  }

  /** Play one action (a player's or the computer's). False if it could not be played. */
  private perform(action: Action): boolean {
    this.runClock();
    const before = this.match;
    if (!before || before.outcome) return false;
    const mover = before.pos.turn;
    const result = playAction(before, action);
    if (!result) return false;
    this.match = result.match;
    if (this.clock && result.report.turnEnded) this.clock = pressClock(this.clock, mover);

    this.choice = noChoice();
    this.event = eventText(action, result.report, this.setup, mover);
    this.playSounds(action, result.report);
    if ((action.type === 'move' || action.type === 'teleport') && !isReduceMotion()) {
      this.slide = { from: action.from, to: action.to, started: performance.now() };
    }
    this.render();
    this.continueTurn();
    return true;
  }

  private playSounds(action: Action, report: TurnReport): void {
    if (action.type !== 'move') playSfx('ability');
    else if (report.captured) playSfx('attack');
    else playSfx('select');
    if (report.collected) playSfx('gather');
    if (report.check) playSfx('alert');
  }

  private finish(): void {
    const match = this.match;
    if (!match?.outcome) return;
    this.stopComputer();
    if (this.clock) this.clock = stopClock(this.clock);
    this.choice = noChoice();
    this.screen = 'over';
    const { winner } = match.outcome;
    const human = this.setup.vsComputer ? this.setup.human : null;
    if (!this.recorded && human !== null) {
      const result = winner === null ? 'draw' : winner === human ? 'win' : 'loss';
      const done = finishGame(this.progress, {
        mode: match.mode,
        level: this.setup.level,
        result,
        captured: match.captured[human],
      });
      this.remember(done.progress);
      if (match.mode === 'upgrades') this.earned = { earned: done.earned, total: done.progress.points };
    }
    this.recorded = true;
    playSfx(winner !== null && (human === null || winner === human) ? 'victory' : 'defeat');
    this.render();
    this.showOver();
  }

  private showOver(): void {
    const outcome = this.match?.outcome;
    if (!outcome) return;
    const human = this.setup.vsComputer ? this.setup.human : null;
    this.openPanel(
      overPanel(
        {
          title: endTitle(outcome, human),
          reason: endReason(outcome, human),
          points: this.earned,
          workshop: human !== null && this.setup.mode === 'upgrades',
        },
        {
          onAgain: () => this.playAgain(),
          onBoard: () => {
            this.screen = 'review';
            this.closePanel();
            this.render();
          },
          onWorkshop: () => {
            this.leaveGame();
            this.menus?.workshop(PAWN, '');
          },
          onModes: () => this.showModes(),
        },
      ),
    );
  }

  // ---------------------------------------------------------------- pause, help, promotion

  /** Stop the clock and the computer to open a box over the game; false if there is no game to cover. */
  private interrupt(screen: 'pause' | 'help'): boolean {
    if (this.screen !== 'playing' && this.screen !== 'review') return false;
    this.runClock();
    // The clock may have just run out, which ends the game and opens its own box.
    if (this.panel) return false;
    this.stopComputer();
    this.screen = screen;
    return true;
  }

  private resume(): void {
    this.closePanel();
    this.screen = this.match?.outcome ? 'review' : 'playing';
    this.lastTick = performance.now();
    this.render();
    this.continueTurn();
  }

  private pause(): void {
    if (!this.interrupt('pause')) return;
    const over = !!this.match?.outcome;
    this.openPanel(
      pausePanel(over, {
        onResume: () => this.resume(),
        onNewGame: () => this.playAgain(),
        onResign: over ? undefined : () => this.giveUp(),
        onModes: () => this.showModes(),
      }),
    );
  }

  /** Against the computer you resign your own game; with two players the side to move does. */
  private giveUp(): void {
    if (!this.match) return;
    this.match = resign(this.match, this.setup.vsComputer ? this.setup.human : this.match.pos.turn);
    this.closePanel();
    this.screen = 'playing';
    this.finish();
  }

  private openHelp(): void {
    if (!this.interrupt('help')) return;
    const pages = helpPages(this.setup.mode, upgradeSides(this.setup));
    const show = (page: number): void => {
      this.openPanel(helpPanel(pages, page, () => show((page + 1) % pages.length), () => this.resume()));
    };
    show(0);
  }

  private showPromotion(from: number, to: number, double: boolean): void {
    this.screen = 'promote';
    this.openPanel(
      promotePanel(
        (promo) => {
          this.closePanel();
          this.screen = 'playing';
          this.perform({ type: 'move', from, to, promo, double });
        },
        () => this.cancelPromotion(),
      ),
    );
  }

  private cancelPromotion(): void {
    this.closePanel();
    this.screen = 'playing';
    this.choose(noChoice());
  }

  private readonly onEscape = (): void => {
    if (this.screen === 'pause' || this.screen === 'help') this.resume();
    else if (this.screen === 'promote') this.cancelPromotion();
    else if (this.screen === 'playing' && (this.choice.power || this.choice.selected >= 0)) this.choose(noChoice());
    else this.pause();
  };

  // ---------------------------------------------------------------- taps

  private choose(choice: Choice): void {
    if (choice.selected >= 0 && choice.selected !== this.choice.selected) playSfx('select');
    this.choice = choice;
    this.render();
  }

  private squareUnder(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): number {
    // A tap on a button (or on a box and the shade behind it) belongs to that, not the board.
    if (over.length > 0 || this.panel || !this.board || !this.match) return -1;
    return squareFromPoint(this.board.board, pointer.x, pointer.y, this.flipped);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    const square = this.squareUnder(pointer, over);
    this.press = null;
    if (square < 0) return;
    if (!this.canAct()) {
      this.press = { square, deselects: false };
      return;
    }
    const down = pressBoard(this.match!.pos, this.choice, square);
    this.press = down.press;
    if (down.choice !== this.choice) this.choose(down.choice);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    const square = this.squareUnder(pointer, over);
    const press = this.press;
    this.press = null;
    if (square < 0 || !press) return;
    if (!this.canAct()) {
      // While waiting, a tap still explains what is on the square.
      if (describeSquare(this.match!.pos, square)) this.choose({ ...this.choice, about: { square } });
      return;
    }
    const result = releaseBoard(this.match!.pos, this.choice, press, square);
    if (result.action) this.perform(result.action);
    else if (result.promotion) this.showPromotion(result.promotion.from, result.promotion.to, result.promotion.double);
    else if (result.choice !== this.choice) this.choose(result.choice);
  }

  private onPowerButton(kind: PowerKind): void {
    if (!this.match) return;
    const next = tapPower(this.match.pos, this.choice, kind, this.canAct());
    if (next.power) playSfx('ui');
    this.choose(next);
  }

  // ---------------------------------------------------------------- time

  /** Charge the time since the last call to whoever's clock is running. */
  private runClock(): void {
    const now = performance.now();
    const elapsed = now - this.lastTick;
    this.lastTick = now;
    if (!this.clock || !this.match || this.match.outcome) return;
    if (this.screen !== 'playing' && this.screen !== 'promote') return;
    this.clock = tickClock(this.clock, elapsed);
    const out = flaggedColor(this.clock);
    if (out === null) {
      this.hud?.setClocks(this.clockView(this.farColor()), this.clockView(otherColor(this.farColor())));
      return;
    }
    this.match = flagFall(this.match, out);
    this.slide = null;
    this.closePanel();
    this.screen = 'playing';
    this.finish();
  }

  update(): void {
    this.runClock();
    if (!this.slide) return;
    if (performance.now() - this.slide.started >= SLIDE_MS) {
      this.slide = null;
      this.render();
      this.continueTurn();
    } else {
      this.drawBoardNow();
    }
  }

  // ---------------------------------------------------------------- drawing

  private farColor(): Color {
    return this.flipped ? WHITE : BLACK;
  }

  private clockView(color: Color): ClockView | null {
    if (!this.clock) return null;
    const ms = this.clock.remaining[color];
    return { text: formatClock(ms), low: ms < 20_000 };
  }

  private cardView(match: Match, color: Color): CardView {
    return {
      name: playerName(this.setup, color),
      color,
      captured: match.captured[color],
      held: POWER_KINDS.flatMap((kind) => Array<PowerKind>(match.pos.held[color][kind]).fill(kind)),
      clock: this.clockView(color),
      active: !match.outcome && match.pos.turn === color,
    };
  }

  private trayView(match: Match): TrayView[] | null {
    if (match.mode !== 'powerup') return null;
    const side = this.setup.vsComputer ? this.setup.human : match.pos.turn;
    return POWER_KINDS.map((kind) => ({
      kind,
      label: powerName(kind),
      count: match.pos.held[side][kind],
      ready: this.canAct() && !match.pos.second && match.pos.held[side][kind] > 0,
      selected: this.choice.power?.kind === kind,
      onClick: () => this.onPowerButton(kind),
    }));
  }

  private hudView(match: Match): HudView {
    const far = this.farColor();
    const flip = (): void => {
      this.flipped = !this.flipped;
      this.render();
    };
    return {
      title: modeName(match.mode),
      far: this.cardView(match, far),
      near: this.cardView(match, otherColor(far)),
      ...statusLines(match, this.setup, this.choice, this.humanTurn(), this.event),
      tray: this.trayView(match),
      buttons: [
        { label: t('chess.btn.help'), onClick: () => this.openHelp() },
        { label: t('chess.btn.flip'), onClick: flip },
        { label: t('chess.btn.menu'), onClick: () => this.pause() },
      ],
      info: infoText(match, this.choice.about, this.setup.vsComputer ? this.setup.human : null),
    };
  }

  private render(): void {
    if (!this.match || !this.board) return;
    this.drawBoardNow();
    this.hud?.render(this.board, this.hudView(this.match));
  }

  private drawBoardNow(): void {
    const { match, board, canvas, boardTexture } = this;
    const ctx = canvas?.getContext('2d');
    if (!match || !board || !ctx) return;
    const { pos } = match;
    const last = match.log[match.log.length - 1]?.action;
    const { power, selected, targets } = this.choice;
    ctx.setTransform(dprOf(), 0, 0, dprOf(), 0, 0);
    drawBoard(ctx, board.board.w, {
      pos,
      flipped: this.flipped,
      selected: power && power.from >= 0 ? power.from : selected,
      targets,
      powerKind: power && power.kind !== 'double' ? power.kind : null,
      lastSquares: !last ? [] : 'target' in last ? [last.target] : [last.from, last.to],
      checkSquare: isInCheck(pos, pos.turn) ? pos.kings[pos.turn] : -1,
      slide: this.slide
        ? { from: this.slide.from, to: this.slide.to, progress: (performance.now() - this.slide.started) / SLIDE_MS }
        : null,
    });
    boardTexture?.refresh();
  }

  private remakeBoardTexture(): void {
    if (this.textures.exists(BOARD_KEY)) this.textures.remove(BOARD_KEY);
    this.boardTexture = this.textures.addCanvas(BOARD_KEY, this.canvas!);
    this.boardImage?.setTexture(BOARD_KEY);
  }

  private readonly layout = (): void => {
    const { width, height } = this.scale;
    if (width < 1 || height < 1) return;
    if (this.cover) {
      const k = Math.max(width / this.cover.width, height / this.cover.height);
      this.cover.setPosition(width / 2, height / 2).setScale(k).setVisible(!this.match);
    }
    this.boardImage?.setVisible(!!this.match);
    if (!this.match || !this.canvas) {
      this.board = null;
      this.hud?.clear();
      return;
    }
    this.board = chessLayout(width, height, this.match.mode === 'powerup');
    const { x, y, w } = this.board.board;
    const pixels = Math.round(w * dprOf());
    if (this.canvas.width !== pixels) {
      this.canvas.width = pixels;
      this.canvas.height = pixels;
      this.remakeBoardTexture();
    }
    this.boardImage?.setPosition(x + w / 2, y + w / 2).setDisplaySize(w, w);
    this.render();
  };

  // ---------------------------------------------------------------- boxes and teardown

  private openPanel(spec: GamePanelSpec): void {
    this.closePanel();
    this.panel = new GamePanel(this, spec);
  }

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = null;
  }

  private onShutdown = (): void => {
    this.stopComputer();
    this.ai?.destroy();
    this.ai = null;
    this.menus = null;
    this.gameNumber++;
    this.scale.off('resize', this.layout, this);
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.input.keyboard?.off('keydown-ESC', this.onEscape, this);
    this.closePanel();
    this.hud?.clear();
    this.hud = null;
    if (this.textures.exists(BOARD_KEY)) this.textures.remove(BOARD_KEY);
    this.boardTexture = null;
    this.boardImage = null;
    this.canvas = null;
    this.cover = null;
    this.board = null;
    this.match = null;
    this.clock = null;
  };
}
