/**
 * GamePickerScene — the games hub, drawn in Phaser 4 in the old card style: navy panels with
 * a gold or green border and a slight tilt, pill tags, a heavy title and a 3D PLAY key.
 * Layout comes from the real canvas size and is rebuilt on resize and on locale change
 * (the canvas can be 0x0 when the scene is created). Tab / arrows move focus, Enter opens.
 *
 * Called by: src/main.ts (first scene). Reads: GAME_REGISTRY. Sizes: ./pickerLayout.
 */
import Phaser from 'phaser';
import { isReduceMotion } from '../../database/motionPrefs';
import { GAME_REGISTRY, type GameManifest } from '../../games/registry';
import {
  getLocale,
  LOCALE_CHOICES,
  setLocale,
  subscribeLocale,
  t,
  type MessageKey,
} from '../../i18n';
import { playSfx } from '../audio/sfx';
import {
  CARD_ART_PAD,
  CARD_RADIUS,
  GOLD_FILL,
  HUB_ACCENT,
  HUB_FONT,
  HUB_GOLD,
  HUB_INK,
  HUB_INK_DARK,
  HUB_MUTED,
  HUB_PILL,
  HUB_SUBTLE,
  LIVE_FILL,
  PILL_FILL,
  paintBackdrop,
  paintBlob,
  paintCardGlow,
  paintCardPanel,
  paintTitle,
} from '../ui/hubCardArt';
import { isPhoneSizedScreen } from '../ui/screenSize';
import {
  cardTiltDeg,
  clampScroll,
  maxScroll,
  nextFocus,
  pickerMetrics,
  type PickerMetrics,
} from './pickerLayout';

const CARD_COLORS: Record<string, { accent: string; edge: string }> = {
  kane: { accent: '#ffd23f', edge: '#a8791a' },
  'blob-evolution': { accent: '#9dff6a', edge: '#4a9a2c' },
};
const DEFAULT_CARD_COLORS = { accent: '#7be0ff', edge: '#328da8' };

const BLURB_KEYS: Record<string, MessageKey> = {
  kane: 'hub.kane.blurb',
  'blob-evolution': 'hub.blob.blurb',
};

const PAD = 26;
const PLAY_H = 48;
const PLAY_EDGE = 5;
const DRAG_PX = 10;

type Fill = { color: number; alpha: number };

interface PreparedCard {
  game: GameManifest;
  accent: string;
  edge: string;
  inner: Phaser.GameObjects.Container;
  /** Height the content needs, including the PLAY key and the padding. */
  natH: number;
  blocked: boolean;
}

interface CardRef {
  game: GameManifest;
  index: number;
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Graphics;
  playFace: Phaser.GameObjects.Container;
  baseY: number;
  halfH: number;
  tilt: number;
  blocked: boolean;
  hovered: boolean;
}

function hexNumber(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

export class GamePickerScene extends Phaser.Scene {
  private page: Phaser.GameObjects.Container | null = null;
  private backdrop: Phaser.GameObjects.GameObject[] = [];
  private textureKeys: string[] = [];
  private artSeq = 0;
  private cards: CardRef[] = [];
  private focusIndex = -1;
  private scrollY = 0;
  private maxScrollY = 0;
  private builtFor = '';
  private dpr = 1;
  private resizeTimer: Phaser.Time.TimerEvent | null = null;
  private localeUnsub: (() => void) | null = null;
  private loadingText: Phaser.GameObjects.Text | null = null;
  private starting = false;

  constructor() {
    super('GamePicker');
  }

  create(): void {
    this.starting = false;
    this.focusIndex = -1;
    this.scrollY = 0;
    this.builtFor = '';
    this.input.keyboard?.addCapture('TAB');
    this.input.keyboard?.on('keydown', this.onKey, this);
    this.input.on('wheel', this.onWheel, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.scale.on('resize', this.onResize, this);
    this.localeUnsub = subscribeLocale(() => this.rebuild());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    // Safety net for a size or pixel-ratio change that sends no resize event.
    this.time.addEvent({ delay: 400, loop: true, callback: () => this.rebuild() });
    this.rebuild();
    this.autoStartFromUrl();
  }

  private onShutdown(): void {
    this.input.keyboard?.off('keydown', this.onKey, this);
    this.input.keyboard?.removeCapture('TAB');
    this.input.off('wheel', this.onWheel, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.scale.off('resize', this.onResize, this);
    this.localeUnsub?.();
    this.localeUnsub = null;
    this.resizeTimer?.remove();
    this.resizeTimer = null;
    this.teardown();
  }

  private onResize(): void {
    this.resizeTimer?.remove();
    this.resizeTimer = this.time.delayedCall(60, () => this.rebuild());
  }

  private autoStartFromUrl(): void {
    const autoGame = new URLSearchParams(window.location.search).get('game');
    const game = autoGame ? GAME_REGISTRY.find((g) => g.id === autoGame) : undefined;
    if (!game || this.isBlocked(game)) return;
    this.time.delayedCall(300, () => void this.startGame(game));
  }

  private isBlocked(game: GameManifest): boolean {
    return !!game.bigScreenOnly && isPhoneSizedScreen(this.scale.width, this.scale.height);
  }

  // ---------------------------------------------------------------- build

  private rebuild(): void {
    const { width, height } = this.scale;
    const metrics = pickerMetrics(width);
    if (!metrics || height < 1) return; // no size yet: wait for the resize
    this.dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const key = `${width}x${height}|${getLocale()}|${this.dpr}`;
    if (key === this.builtFor) return;
    this.builtFor = key;
    this.teardown();
    this.buildBackdrop(width, height);
    this.buildPage(metrics, width, height);
  }

  private teardown(): void {
    this.tweens.killAll();
    this.page?.destroy(true);
    this.page = null;
    for (const obj of this.backdrop) obj.destroy();
    this.backdrop = [];
    for (const key of this.textureKeys) this.textures.remove(key);
    this.textureKeys = [];
    this.cards = [];
  }

  private addArt(
    canvas: HTMLCanvasElement,
    w: number,
    h: number,
    x: number,
    y: number,
  ): Phaser.GameObjects.Image {
    const key = `hub-art-${this.artSeq++}`;
    this.textures.addCanvas(key, canvas);
    this.textureKeys.push(key);
    return this.add.image(x, y, key).setDisplaySize(w, h);
  }

  private text(
    x: number,
    y: number,
    value: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, value, { fontFamily: HUB_FONT, ...style })
      .setResolution(this.dpr);
  }

  private buildBackdrop(width: number, height: number): void {
    const bg = this.addArt(paintBackdrop(width, height, this.dpr), width, height, 0, 0)
      .setOrigin(0, 0)
      .setDepth(0);
    this.backdrop.push(bg);

    const vmax = Math.max(width, height) / 100;
    const size = 42 * vmax;
    const blobs = [
      { color: '#ff4fd8', alpha: 0.32, x: 11 * vmax, y: 7 * vmax, ms: 18000 },
      { color: '#33d1ff', alpha: 0.32, x: width - 5 * vmax, y: height * 0.3 + 21 * vmax, ms: 23000 },
      { color: '#ffd23f', alpha: 0.22, x: width * 0.2 + 21 * vmax, y: height - 3 * vmax, ms: 27000 },
    ];
    for (const spec of blobs) {
      const blob = this.addArt(paintBlob(size, spec.color, this.dpr), size, size, spec.x, spec.y)
        .setAlpha(spec.alpha)
        .setDepth(1);
      this.backdrop.push(blob);
      if (!isReduceMotion()) {
        this.tweens.add({
          targets: blob,
          x: spec.x + 6 * vmax,
          y: spec.y + 4 * vmax,
          duration: spec.ms,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  private buildPage(m: PickerMetrics, width: number, height: number): void {
    const reduce = isReduceMotion();
    const page = this.add.container(0, 0).setDepth(10);
    this.page = page;
    const left = (width - m.contentW) / 2;
    const right = left + m.contentW;
    let y = 28;

    // Language chips, right-aligned like the old header.
    const chipY = y + 24;
    let chipRight = right;
    for (const choice of [...LOCALE_CHOICES].reverse()) {
      page.add(this.localeChip(choice, chipRight - 24, chipY));
      chipRight -= 48 + 8;
    }
    page.add(
      this.text(chipRight - 4, chipY, t('menu.language'), { fontSize: '12px', color: HUB_SUBTLE }).setOrigin(
        1,
        0.5,
      ),
    );
    y += 48 + 20;

    const title = paintTitle(t('hub.title'), m.titleSize, this.dpr);
    const titleImg = this.addArt(title.canvas, title.width, title.height, width / 2, y + title.height / 2);
    titleImg.setRotation(reduce ? 0 : Phaser.Math.DegToRad(-2));
    page.add(titleImg);
    y += title.height + 8;

    const subtitle = this.text(width / 2, y, t('hub.subtitle'), {
      fontSize: '16px',
      color: HUB_MUTED,
      align: 'center',
      wordWrap: { width: m.contentW },
    }).setOrigin(0.5, 0);
    page.add(subtitle);
    y += subtitle.height + 28;

    const prepared = GAME_REGISTRY.map((game) => this.prepareCard(game, m.cardW, width, height));
    for (let i = 0; i < prepared.length; i += m.columns) {
      const row = prepared.slice(i, i + m.columns);
      const rowH = Math.max(...row.map((p) => p.natH));
      const rowW = row.length * m.cardW + (row.length - 1) * m.gap;
      const rowLeft = left + (m.contentW - rowW) / 2;
      row.forEach((p, col) => {
        const cx = rowLeft + col * (m.cardW + m.gap) + m.cardW / 2;
        const ref = this.finishCard(p, cx, y + rowH / 2, m.cardW, rowH, i + col, reduce);
        page.add(ref.container);
        this.cards.push(ref);
      });
      y += rowH + m.gap;
    }

    y += 4;
    const footerY = y + 24;
    this.buildFooter(page, width, footerY);
    y = footerY + 24 + 28;

    this.maxScrollY = maxScroll(y, height);
    this.scrollY = clampScroll(this.scrollY, this.maxScrollY);
    page.setY(-this.scrollY);
    if (this.focusIndex >= this.cards.length) this.focusIndex = -1;
    for (const ref of this.cards) this.refreshCard(ref, false);
  }

  private buildFooter(page: Phaser.GameObjects.Container, width: number, footerY: number): void {
    const year = this.text(0, footerY, t('hub.year', { n: new Date().getFullYear() }), {
      fontSize: '14px',
      color: HUB_SUBTLE,
    }).setOrigin(0, 0.5);
    const privacy = this.text(0, footerY, t('menu.privacy'), { fontSize: '14px', color: HUB_SUBTLE }).setOrigin(
      0,
      0.5,
    );
    const terms = this.text(0, footerY, t('menu.terms'), { fontSize: '14px', color: HUB_SUBTLE }).setOrigin(
      0,
      0.5,
    );
    const gap = 24;
    const total = year.width + privacy.width + terms.width + gap * 2;
    let x = (width - total) / 2;
    year.setX(x);
    x += year.width + gap;
    privacy.setX(x);
    x += privacy.width + gap;
    terms.setX(x);
    page.add([year, privacy, terms]);

    for (const [item, href] of [
      [privacy, '/privacy.html'],
      [terms, '/terms.html'],
    ] as const) {
      const line = this.add.graphics();
      line.lineStyle(1, hexNumber(HUB_SUBTLE), 1);
      line.lineBetween(item.x, footerY + item.height / 2, item.x + item.width, footerY + item.height / 2);
      const zone = this.add
        .zone(item.x + item.width / 2, footerY, item.width + 16, 48)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (pointer.getDistance() > DRAG_PX) return;
        window.location.href = href;
      });
      page.add([line, zone]);
    }
  }

  private localeChip(
    choice: { id: (typeof LOCALE_CHOICES)[number]['id']; short: string },
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const selected = choice.id === getLocale();
    const face = this.add.graphics();
    face.fillStyle(selected ? 0xffe28a : 0xffffff, selected ? 1 : 0.1);
    face.fillRoundedRect(-24, -24, 48, 48, 12);
    const label = this.text(0, 0, choice.short, {
      fontSize: '14px',
      fontStyle: '800',
      color: selected ? HUB_INK_DARK : HUB_INK,
    }).setOrigin(0.5);
    const zone = this.add.zone(0, 0, 48, 48).setInteractive({ useHandCursor: true });
    zone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.getDistance() > DRAG_PX || getLocale() === choice.id) return;
      playSfx('ui');
      setLocale(choice.id);
    });
    return this.add.container(x, y, [face, label, zone]);
  }

  // ---------------------------------------------------------------- cards

  private pill(label: string, fill: Fill, color: string, tiltDeg: number): Phaser.GameObjects.Container {
    const txt = this.text(0, 0, label.toUpperCase(), {
      fontSize: '12px',
      fontStyle: '800',
      color,
      letterSpacing: 0.96,
    }).setOrigin(0.5);
    const w = Math.ceil(txt.width + 22);
    const h = Math.ceil(txt.height + 12);
    const face = this.add.graphics();
    face.fillStyle(fill.color, fill.alpha);
    face.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    const pill = this.add.container(0, 0, [face, txt]);
    pill.setSize(w, h);
    pill.setRotation(isReduceMotion() ? 0 : Phaser.Math.DegToRad(tiltDeg));
    return pill;
  }

  /** Builds a card's content with its top-left at (0, 0) and measures how tall it needs to be. */
  private prepareCard(game: GameManifest, cardW: number, viewW: number, viewH: number): PreparedCard {
    const colors = CARD_COLORS[game.id] ?? DEFAULT_CARD_COLORS;
    const blocked = !!game.bigScreenOnly && isPhoneSizedScreen(viewW, viewH);
    const innerW = cardW - PAD * 2;
    const inner = this.add.container(0, 0);

    const tagline = this.pill(game.tagline, PILL_FILL, HUB_PILL, -3);
    const status =
      game.status === 'live'
        ? this.pill(t('hub.live'), LIVE_FILL, HUB_ACCENT, 2.5)
        : this.pill(t('hub.experimental'), GOLD_FILL, HUB_GOLD, 2.5);
    const tagW = tagline.width;
    const staW = status.width;
    let y = PAD;
    if (tagW + 6 + staW <= innerW) {
      const x = (cardW - (tagW + 6 + staW)) / 2;
      tagline.setPosition(x + tagW / 2, y + tagline.height / 2);
      status.setPosition(x + tagW + 6 + staW / 2, y + status.height / 2);
      y += Math.max(tagline.height, status.height);
    } else {
      tagline.setPosition(cardW / 2, y + tagline.height / 2);
      y += tagline.height + 6;
      status.setPosition(cardW / 2, y + status.height / 2);
      y += status.height;
    }
    inner.add([tagline, status]);
    y += 12;

    const title = this.text(cardW / 2, y, game.title, {
      fontSize: `${Math.round(Math.min(36, Math.max(28, viewW * 0.06)))}px`,
      fontStyle: 'bold',
      color: HUB_INK,
      align: 'center',
      letterSpacing: -1.5,
      wordWrap: { width: innerW },
    }).setOrigin(0.5, 0);
    inner.add(title);
    y += title.height + 8;

    const blurb = BLURB_KEYS[game.id];
    const desc = this.text(cardW / 2, y, blurb ? t(blurb) : game.description, {
      fontSize: '16px',
      color: HUB_MUTED,
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: innerW },
    }).setOrigin(0.5, 0);
    inner.add(desc);
    y += desc.height + 18;

    if (blocked) {
      const notice = this.text(cardW / 2, y, t('menu.bigScreen'), {
        fontSize: '14px',
        fontStyle: '600',
        color: HUB_GOLD,
        align: 'center',
        wordWrap: { width: innerW },
      }).setOrigin(0.5, 0);
      inner.add(notice);
      y += notice.height + 18;
    }

    return { game, accent: colors.accent, edge: colors.edge, inner, natH: y + PLAY_H + PAD, blocked };
  }

  private finishCard(
    p: PreparedCard,
    cx: number,
    cy: number,
    cardW: number,
    cardH: number,
    index: number,
    reduce: boolean,
  ): CardRef {
    const artW = cardW + CARD_ART_PAD * 2;
    const artH = cardH + CARD_ART_PAD * 2;
    const glow = this.addArt(paintCardGlow(cardW, cardH, p.accent, this.dpr), artW, artH, 0, 0).setAlpha(0.5);
    const panel = this.addArt(paintCardPanel(cardW, cardH, p.accent, this.dpr), artW, artH, 0, 0);
    p.inner.setPosition(-cardW / 2, -cardH / 2);

    const label = this.text(0, 0, t('hub.play').toUpperCase(), {
      fontSize: '15px',
      fontStyle: '900',
      color: HUB_INK_DARK,
    }).setOrigin(0.5);
    const keyW = Math.ceil(label.width + 56);
    const edge = this.add.graphics();
    edge.fillStyle(hexNumber(p.edge), 1);
    edge.fillRoundedRect(-keyW / 2, -PLAY_H / 2 + PLAY_EDGE, keyW, PLAY_H, 14);
    const face = this.add.graphics();
    face.fillStyle(hexNumber(p.accent), 1);
    face.fillRoundedRect(-keyW / 2, -PLAY_H / 2, keyW, PLAY_H, 14);
    const playFace = this.add.container(0, 0, [face, label]);
    const play = this.add.container(0, cardH / 2 - PAD - PLAY_H / 2 - PLAY_EDGE / 2, [edge, playFace]);
    if (p.blocked) play.setAlpha(0.5);

    const ring = this.add.graphics();
    ring.lineStyle(3, hexNumber(HUB_ACCENT), 1);
    ring.strokeRoundedRect(-cardW / 2 - 4, -cardH / 2 - 4, cardW + 8, cardH + 8, CARD_RADIUS + 4);
    ring.setVisible(false);

    const zone = this.add.zone(0, 0, cardW, cardH).setInteractive({ useHandCursor: !p.blocked });
    const tilt = reduce ? 0 : Phaser.Math.DegToRad(cardTiltDeg(index));
    const container = this.add.container(cx, cy, [glow, panel, p.inner, play, ring, zone]);
    container.setRotation(tilt);

    const ref: CardRef = {
      game: p.game,
      index,
      container,
      glow,
      ring,
      playFace,
      baseY: cy,
      halfH: cardH / 2,
      tilt,
      blocked: p.blocked,
      hovered: false,
    };
    zone.on('pointerover', () => {
      ref.hovered = true;
      this.refreshCard(ref, true);
      if (!ref.blocked && !reduce) this.wobble(ref);
    });
    zone.on('pointerout', () => {
      ref.hovered = false;
      this.refreshCard(ref, true);
    });
    zone.on('pointerdown', () => {
      if (!ref.blocked) ref.playFace.setY(PLAY_EDGE - 2);
    });
    zone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      ref.playFace.setY(0);
      if (pointer.getDistance() > DRAG_PX) return;
      this.open(ref);
    });
    zone.on('pointerupoutside', () => ref.playFace.setY(0));
    return ref;
  }

  /** Lifted (hover or keyboard focus) cards straighten and rise, as the old cards did. */
  private refreshCard(ref: CardRef, animate: boolean): void {
    const lifted = ref.hovered || this.focusIndex === ref.index;
    ref.ring.setVisible(this.focusIndex === ref.index);
    const reduce = isReduceMotion();
    const target = {
      rotation: lifted || reduce ? 0 : ref.tilt,
      y: lifted && !reduce ? ref.baseY - 6 : ref.baseY,
      scale: lifted && !reduce ? 1.03 : 1,
    };
    this.tweens.killTweensOf(ref.container);
    this.tweens.killTweensOf(ref.glow);
    const glowAlpha = lifted ? 1 : 0.5;
    if (!animate || reduce) {
      ref.container.setRotation(target.rotation).setY(target.y).setScale(target.scale);
      ref.glow.setAlpha(glowAlpha);
      return;
    }
    this.tweens.add({ targets: ref.container, ...target, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: ref.glow, alpha: glowAlpha, duration: 200 });
  }

  private wobble(ref: CardRef): void {
    this.tweens.killTweensOf(ref.playFace);
    ref.playFace.setRotation(0);
    this.tweens.add({
      targets: ref.playFace,
      rotation: [-0.07, 0.05, -0.035, 0],
      duration: 600,
      ease: 'Sine.easeInOut',
    });
  }

  // ---------------------------------------------------------------- input

  private onKey(event: KeyboardEvent): void {
    if (this.starting) return;
    if (event.key === 'Tab') {
      event.preventDefault();
      this.moveFocus(event.shiftKey ? -1 : 1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      this.moveFocus(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      this.moveFocus(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      const ref = this.cards[this.focusIndex];
      if (ref) {
        event.preventDefault();
        this.open(ref);
      }
    }
  }

  private moveFocus(step: 1 | -1): void {
    const previous = this.cards[this.focusIndex];
    this.focusIndex = nextFocus(this.focusIndex, this.cards.length, step);
    if (previous) this.refreshCard(previous, true);
    const next = this.cards[this.focusIndex];
    if (!next) return;
    this.refreshCard(next, true);
    const top = next.baseY - next.halfH - 24;
    const bottom = next.baseY + next.halfH + 24;
    const view = this.scale.height;
    if (top < this.scrollY) this.scrollTo(top);
    else if (bottom > this.scrollY + view) this.scrollTo(bottom - view);
  }

  private onWheel(_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number): void {
    this.scrollTo(this.scrollY + dy);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown || this.maxScrollY <= 0 || pointer.getDistance() < DRAG_PX) return;
    this.scrollTo(this.scrollY - (pointer.y - pointer.prevPosition.y));
  }

  private scrollTo(value: number): void {
    this.scrollY = clampScroll(value, this.maxScrollY);
    this.page?.setY(-this.scrollY);
  }

  private open(ref: CardRef): void {
    if (ref.blocked || this.starting) return;
    void this.startGame(ref.game);
  }

  // ---------------------------------------------------------------- start

  private async startGame(game: GameManifest): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    playSfx('ui');
    this.showLoading(t('hub.loading', { title: game.title }));
    try {
      await game.dynamicImport();
      this.scene.start(game.sceneKey);
    } catch (error) {
      console.error(`Failed to load game ${game.id}:`, error);
      this.starting = false;
      this.hideLoading();
      this.showError(t('hub.loadError'));
    }
  }

  private showLoading(message: string): void {
    const { width, height } = this.scale;
    this.loadingText = this.text(width / 2, height / 2, message, {
      fontSize: '20px',
      color: HUB_GOLD,
      align: 'center',
      backgroundColor: '#07111dcc',
      padding: { x: 18, y: 12 },
    })
      .setOrigin(0.5)
      .setDepth(1000);
    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 1, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private hideLoading(): void {
    if (!this.loadingText) return;
    this.tweens.killTweensOf(this.loadingText);
    this.loadingText.destroy();
    this.loadingText = null;
  }

  private showError(message: string): void {
    const { width, height } = this.scale;
    const errorText = this.text(width / 2, height / 2 + 60, message, {
      fontSize: '18px',
      color: '#ff6b6b',
      align: 'center',
      backgroundColor: '#07111dcc',
      padding: { x: 14, y: 10 },
    })
      .setOrigin(0.5)
      .setDepth(1000);
    this.time.delayedCall(3000, () => errorText.destroy());
  }
}
