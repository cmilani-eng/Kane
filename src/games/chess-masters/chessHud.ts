/**
 * Chess Masters — everything around the board: the two player cards (captures, power-ups held,
 * clock), the status lines, the power-up buttons, Help / Flip / Menu and the note about the
 * tapped piece. It is rebuilt from a plain description whenever something changes; only the
 * clocks are updated in place.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts
 */
import Phaser from 'phaser';
import { HUB_FONT, HUB_GOLD, HUB_INK, HUB_MUTED, HUB_PILL } from '../../presentation/ui/hubCardArt';
import { POWER_KINDS, type Color, type PieceType, type PowerKind } from './chessCore';
import { drawPiece, drawPowerOrb } from './chessArt';
import type { ChessLayout, Rect } from './chessLayout';

export interface CardView {
  name: string;
  color: Color;
  /** Pieces this player has taken (they are the other colour). */
  captured: readonly PieceType[];
  /** Power-ups in hand, one entry each; shown on the cards only. */
  held: readonly PowerKind[];
  clock: ClockView | null;
  /** It is this player's turn. */
  active: boolean;
}

export interface ClockView {
  text: string;
  /** Nearly out of time. */
  low: boolean;
}

export interface TrayView {
  kind: PowerKind;
  label: string;
  count: number;
  /** Can be used right now. A button that cannot still explains itself when tapped. */
  ready: boolean;
  selected: boolean;
  onClick: () => void;
}

export interface HudView {
  title: string;
  far: CardView;
  near: CardView;
  headline: string;
  detail: string;
  alert: boolean;
  tray: readonly TrayView[] | null;
  buttons: readonly { label: string; onClick: () => void }[];
  info: string;
}

const CARD_FILL = 0x12253c;
const ACTIVE_EDGE = 0xffd23f;
const ICON_PX = 96;

const dprOf = (): number => Math.min(window.devicePixelRatio || 1, 2);
const orbKey = (kind: PowerKind): string => `chess-orb-${kind}`;
const miniKey = (color: Color, type: PieceType): string => `chess-mini-${color}-${type}`;

/** Draw the small pictures the cards and buttons use, once per page load. */
export function ensureIconTextures(scene: Phaser.Scene): void {
  const make = (key: string, paint: (ctx: CanvasRenderingContext2D) => void): void => {
    if (scene.textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = ICON_PX;
    canvas.height = ICON_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas is not available');
    paint(ctx);
    scene.textures.addCanvas(key, canvas);
  };
  for (const kind of POWER_KINDS) {
    make(orbKey(kind), (ctx) => drawPowerOrb(ctx, kind, ICON_PX / 2, ICON_PX / 2, ICON_PX * 0.37));
  }
  for (const color of [0, 1] as Color[]) {
    for (const type of [1, 2, 3, 4, 5] as PieceType[]) {
      make(miniKey(color, type), (ctx) => drawPiece(ctx, type, color, 0, 0, ICON_PX));
    }
  }
}

export class ChessHud {
  private readonly scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container | null = null;
  private clockTexts: (Phaser.GameObjects.Text | null)[] = [null, null];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  clear(): void {
    this.root?.destroy(true);
    this.root = null;
    this.clockTexts = [null, null];
  }

  render(layout: ChessLayout, view: HudView): void {
    this.clear();
    const root = this.scene.add.container(0, 0).setDepth(5);
    this.root = root;

    if (!layout.wide || this.scene.scale.height >= 520) {
      const centre = layout.wide ? layout.board.x + layout.board.w / 2 : this.scene.scale.width / 2;
      root.add(this.text(centre, 25, view.title, 14, HUB_PILL, '900').setOrigin(0.5));
    }
    this.card(root, layout.far, view.far, 0);
    this.card(root, layout.near, view.near, 1);
    this.status(root, layout.status, view);
    if (layout.tray && view.tray) this.tray(root, layout.tray, view.tray);
    this.buttonRow(root, layout.buttons, view.buttons);
    this.info(root, layout.info, view.info, layout.wide);
  }

  /** The far and near clocks, without rebuilding anything. */
  setClocks(far: ClockView | null, near: ClockView | null): void {
    [far, near].forEach((clock, i) => {
      const text = this.clockTexts[i];
      if (!text || !clock) return;
      if (text.text !== clock.text) text.setText(clock.text);
      const color = clock.low ? '#ff8a8a' : HUB_INK;
      if (text.style.color !== color) text.setColor(color);
    });
  }

  private text(
    x: number,
    y: number,
    value: string,
    size: number,
    color: string,
    weight = '700',
    extra: Phaser.Types.GameObjects.Text.TextStyle = {},
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, value, { fontFamily: HUB_FONT, fontSize: `${size}px`, fontStyle: weight, color, ...extra })
      .setResolution(dprOf());
  }

  private panel(rect: Rect, fill: number, alpha: number, edge: number, edgeAlpha: number, width = 1): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const radius = Math.min(14, rect.h / 3);
    g.fillStyle(fill, alpha);
    g.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, radius);
    g.lineStyle(width, edge, edgeAlpha);
    g.strokeRoundedRect(rect.x + width / 2, rect.y + width / 2, rect.w - width, rect.h - width, radius);
    return g;
  }

  /** An invisible rectangle takes the taps, so the drawing above it can be anything. */
  private hit(rect: Rect, onClick: () => void): Phaser.GameObjects.Rectangle {
    const zone = this.scene.add
      .rectangle(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerup', onClick);
    return zone;
  }

  private card(root: Phaser.GameObjects.Container, rect: Rect, view: CardView, index: number): void {
    const big = rect.h >= 52;
    root.add(
      this.panel(rect, CARD_FILL, view.active ? 0.98 : 0.78, view.active ? ACTIVE_EDGE : 0xffffff, view.active ? 1 : 0.14, view.active ? 2 : 1),
    );
    const radius = big ? 11 : 8;
    const disc = this.scene.add.circle(rect.x + 12 + radius, rect.y + rect.h / 2, radius, view.color === 0 ? 0xf6efdc : 0x1b1730);
    disc.setStrokeStyle(2, view.color === 0 ? 0x8d7d5c : 0xb9b1e8);
    root.add(disc);

    let right = rect.x + rect.w - 8;
    if (view.clock) {
      const clockW = big ? 94 : 76;
      const box = { x: right - clockW, y: rect.y + (big ? 10 : 5), w: clockW, h: rect.h - (big ? 20 : 10) };
      root.add(this.panel(box, view.active ? 0x2c4a73 : 0x0b1830, 1, 0xffffff, 0.16));
      const clock = this.text(box.x + box.w / 2, box.y + box.h / 2, view.clock.text, big ? 22 : 18, view.clock.low ? '#ff8a8a' : HUB_INK, '900').setOrigin(0.5);
      this.clockTexts[index] = clock;
      root.add(clock);
      right = box.x - 8;
    }
    const orb = big ? 28 : 22;
    for (let i = view.held.length - 1; i >= 0; i--) {
      root.add(this.scene.add.image(right - orb / 2, rect.y + rect.h / 2, orbKey(view.held[i]!)).setDisplaySize(orb, orb));
      right -= orb - 1;
    }

    const left = rect.x + 20 + radius * 2;
    const room = Math.max(40, right - left - 6);
    const name = this.text(left, rect.y + (big ? 9 : 4), view.name, big ? 15 : 13, HUB_INK, '800');
    if (name.width > room) name.setScale(room / name.width);
    root.add(name);

    const mini = big ? 24 : 17;
    const taken = view.captured.slice().sort((a, b) => b - a);
    const step = Math.min(mini * 0.62, taken.length > 1 ? (room - mini) / (taken.length - 1) : mini);
    taken.forEach((type, i) => {
      const image = this.scene.add.image(left + mini / 2 + i * step, rect.y + rect.h - mini / 2 - (big ? 7 : 2), miniKey(view.color === 0 ? 1 : 0, type));
      root.add(image.setDisplaySize(mini, mini));
    });
  }

  private status(root: Phaser.GameObjects.Container, rect: Rect, view: HudView): void {
    const roomy = rect.h >= 52;
    const cx = rect.x + rect.w / 2;
    const headline = this.text(cx, rect.y + 1, view.headline, roomy ? 18 : 15, view.alert ? HUB_GOLD : HUB_INK, '900', {
      align: 'center',
    }).setOrigin(0.5, 0);
    if (headline.width > rect.w) headline.setScale(rect.w / headline.width);
    root.add(headline);
    if (!view.detail) return;
    const top = rect.y + headline.displayHeight + 2;
    const detail = this.text(cx, top, view.detail, roomy ? 13 : 12, HUB_MUTED, '600', {
      align: 'center',
      wordWrap: { width: rect.w },
    }).setOrigin(0.5, 0);
    const space = rect.y + rect.h - top + 4;
    if (detail.height > space) detail.setScale(Math.max(0.78, space / detail.height));
    root.add(detail);
  }

  private tray(root: Phaser.GameObjects.Container, rect: Rect, items: readonly TrayView[]): void {
    const grid = rect.h >= 84;
    const columns = grid ? 2 : 4;
    const rows = grid ? 2 : 1;
    const gap = 6;
    const w = (rect.w - gap * (columns - 1)) / columns;
    const h = (rect.h - gap * (rows - 1)) / rows;
    items.forEach((item, i) => {
      const box = { x: rect.x + (i % columns) * (w + gap), y: rect.y + Math.floor(i / columns) * (h + gap), w, h };
      const face = this.panel(box, item.selected ? 0x3a5c8c : CARD_FILL, 0.96, item.selected ? ACTIVE_EDGE : 0xffffff, item.selected ? 1 : 0.18, item.selected ? 3 : 1);
      const count = `×${item.count}`;
      const parts: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [];
      if (grid) {
        const icon = Math.min(34, h - 8);
        parts.push(this.scene.add.image(box.x + 6 + icon / 2, box.y + h / 2, orbKey(item.kind)).setDisplaySize(icon, icon));
        const textX = box.x + icon + 12;
        const label = this.text(textX, box.y + h / 2, `${item.label}\n${count}`, 12, HUB_INK, '800', { lineSpacing: 1 }).setOrigin(0, 0.5);
        const room = box.x + w - textX - 4;
        if (label.width > room) label.setScale(room / label.width);
        parts.push(label);
      } else {
        const icon = Math.min(26, h * 0.54);
        parts.push(this.scene.add.image(box.x + w / 2 - 10, box.y + 3 + icon / 2, orbKey(item.kind)).setDisplaySize(icon, icon));
        parts.push(this.text(box.x + w / 2 + 6, box.y + 3 + icon / 2, count, 12, HUB_INK, '900').setOrigin(0, 0.5));
        const label = this.text(box.x + w / 2, box.y + h - 3, item.label, 10, HUB_INK, '800').setOrigin(0.5, 1);
        if (label.width > w - 4) label.setScale((w - 4) / label.width);
        parts.push(label);
      }
      const dim = item.ready || item.selected ? 1 : 0.4;
      for (const part of parts) part.setAlpha(dim);
      root.add([face, ...parts, this.hit(box, item.onClick)]);
    });
  }

  private buttonRow(root: Phaser.GameObjects.Container, rect: Rect, buttons: HudView['buttons']): void {
    const gap = 8;
    const w = (rect.w - gap * (buttons.length - 1)) / buttons.length;
    buttons.forEach((button, i) => {
      const box = { x: rect.x + i * (w + gap), y: rect.y, w, h: rect.h };
      const face = this.panel(box, 0x21406a, 1, 0x7be0ff, 0.5);
      const label = this.text(box.x + w / 2, box.y + box.h / 2, button.label, 13, HUB_INK, '900').setOrigin(0.5);
      if (label.width > w - 8) label.setScale((w - 8) / label.width);
      root.add([face, label, this.hit(box, button.onClick)]);
    });
  }

  private info(root: Phaser.GameObjects.Container, rect: Rect, info: string, wide: boolean): void {
    if (!info || rect.h < 22) return;
    const size = wide && rect.h >= 120 ? 14 : 12;
    const text = this.text(rect.x + rect.w / 2, rect.y + 2, info, size, HUB_MUTED, '500', {
      align: 'center',
      lineSpacing: 2,
      wordWrap: { width: rect.w - 8 },
    }).setOrigin(0.5, 0);
    // Long help shrinks to fit rather than running into the buttons below.
    if (text.height > rect.h - 2) text.setScale(Math.max(0.72, (rect.h - 2) / text.height));
    root.add(text);
  }
}
