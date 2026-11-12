/**
 * Blob Evolution — the centred "boxes" (start, rock-paper-scissors, game over) drawn in
 * Phaser with the look of the original DOM panels: navy 145deg rounded card, pill tag,
 * big tight title, muted copy and chunky 3D cyan keys.
 *
 * Called by: src/games/blob-evolution/BlobEvolutionScene.ts
 */
import Phaser from 'phaser';
import {
  HUB_FONT,
  HUB_GOLD,
  HUB_INK,
  HUB_INK_DARK,
  HUB_MUTED,
  HUB_PILL,
  HUB_SUBTLE,
  PILL_FILL,
} from '../../presentation/ui/hubCardArt';

export interface BlobPanelButton {
  label: string;
  onClick: () => void;
  /** Rock/paper/scissors keys: wider, taller, bigger label. */
  choice?: boolean;
}

export interface BlobPanelSpec {
  pill: string;
  title: string;
  copy?: string;
  /** Bold line under the copy (the evolution chain). */
  chain?: string;
  /** Live gold status line (rock-paper-scissors result). `''` reserves the space. */
  result?: string;
  note?: string;
  buttons: BlobPanelButton[];
}

const PANEL_MAX_W = 520;
const PANEL_RADIUS = 24;
const SHADOW_PAD = 110;
const KEY_EDGE = 0x328da8;
const KEY_FACE = 0x7be0ff;
const KEY_FACE_HOVER = 0x8ae6ff;
const KEY_DEPTH = 5;
const DEPTH = 30;

function dprOf(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

/** Panel width and padding for a viewport, as the CSS had them (`min(520px, 100%)`, narrower padding under 600px). */
export function panelMetrics(viewW: number): { width: number; padX: number; padY: number; titleSize: number } {
  const width = Math.min(PANEL_MAX_W, Math.max(240, viewW - 40));
  const narrow = viewW <= 600;
  return {
    width,
    padX: narrow ? 17 : 26,
    padY: narrow ? 21 : 26,
    titleSize: Math.round(Math.min(44, Math.max(28, viewW * 0.06))),
  };
}

function paintPanelFace(w: number, h: number, dpr: number): HTMLCanvasElement {
  const pad = SHADOW_PAD;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((w + pad * 2) * dpr));
  canvas.height = Math.max(1, Math.round((h + pad * 2) * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  ctx.scale(dpr, dpr);

  // CSS 145deg: from the top-left toward the bottom-right.
  const rad = (145 * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const cx = pad + w / 2;
  const cy = pad + h / 2;
  const grad = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  grad.addColorStop(0, 'rgba(18, 37, 60, 0.96)');
  grad.addColorStop(1, 'rgba(8, 18, 33, 0.96)');

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 80 * dpr;
  ctx.shadowOffsetY = 24 * dpr;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(pad, pad, w, h, PANEL_RADIUS);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(pad + 0.5, pad + 0.5, w - 1, h - 1, PANEL_RADIUS - 0.5);
  ctx.stroke();
  return canvas;
}

let panelSerial = 0;

/** One open panel. Re-lays itself out on resize; `destroy()` removes everything it made. */
export class BlobPanel {
  private readonly scene: Phaser.Scene;
  private spec: BlobPanelSpec;
  private readonly textureKey: string;
  private root: Phaser.GameObjects.Container | null = null;
  private dim: Phaser.GameObjects.Rectangle | null = null;
  private destroyed = false;

  constructor(scene: Phaser.Scene, spec: BlobPanelSpec) {
    this.scene = scene;
    this.spec = spec;
    this.textureKey = `blob-panel-${++panelSerial}`;
    this.layout();
    scene.scale.on('resize', this.layout, this);
    scene.input.keyboard?.on('keydown-ENTER', this.onEnter, this);
  }

  /** Update the gold status line (rock-paper-scissors result). */
  setResult(text: string): void {
    this.spec = { ...this.spec, result: text };
    this.layout();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.scale.off('resize', this.layout, this);
    this.scene.input.keyboard?.off('keydown-ENTER', this.onEnter, this);
    this.clear();
  }

  private readonly onEnter = (): void => {
    const primary = this.spec.buttons.find((b) => !b.choice);
    primary?.onClick();
  };

  private clear(): void {
    this.root?.destroy();
    this.dim?.destroy();
    this.root = null;
    this.dim = null;
    if (this.scene.textures.exists(this.textureKey)) this.scene.textures.remove(this.textureKey);
  }

  private text(content: string, size: number, color: string, opts: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.GameObjects.Text {
    return this.scene.add
      .text(0, 0, content, {
        fontFamily: HUB_FONT,
        fontSize: `${size}px`,
        color,
        align: 'center',
        ...opts,
      })
      .setOrigin(0.5, 0)
      .setResolution(dprOf());
  }

  private readonly layout = (): void => {
    if (this.destroyed) return;
    this.clear();

    const scene = this.scene;
    const { width: viewW, height: viewH } = scene.scale;
    if (viewW < 1 || viewH < 1) return;
    const m = panelMetrics(viewW);
    const innerW = m.width - m.padX * 2;
    const { spec } = this;

    this.dim = scene.add
      .rectangle(0, 0, viewW, viewH, 0x030a14, 0.48)
      .setOrigin(0, 0)
      .setDepth(DEPTH - 1)
      .setInteractive(); // swallow clicks meant for the game underneath

    const items: Phaser.GameObjects.GameObject[] = [];
    let y = m.padY;

    // Pill tag
    const pillText = this.text(spec.pill.toLocaleUpperCase(), 12, HUB_PILL, { fontStyle: '800', letterSpacing: 1 });
    const pillW = pillText.width + 22;
    const pillH = pillText.height + 12;
    const pillBg = scene.add.graphics();
    pillBg.fillStyle(PILL_FILL.color, PILL_FILL.alpha);
    pillBg.fillRoundedRect(-pillW / 2, y, pillW, pillH, pillH / 2);
    pillText.setPosition(0, y + 6);
    items.push(pillBg, pillText);
    y += pillH + 12;

    // Title
    const title = this.text(spec.title, m.titleSize, HUB_INK, {
      fontStyle: '700',
      letterSpacing: -1.5,
      wordWrap: { width: innerW },
    });
    title.setPosition(0, y);
    items.push(title);
    y += title.height + 8;

    // Copy, chain, result, note
    const block = (content: string, size: number, color: string, opts: Phaser.Types.GameObjects.Text.TextStyle, after: number): void => {
      const t = this.text(content, size, color, { wordWrap: { width: innerW }, lineSpacing: size * 0.5 - 2, ...opts });
      t.setPosition(0, y);
      items.push(t);
      y += t.height + after;
    };
    if (spec.copy) block(spec.copy, 16, HUB_MUTED, {}, 12);
    if (spec.chain) block(spec.chain, 16, HUB_MUTED, { fontStyle: '700' }, 12);
    if (spec.result !== undefined) {
      const before = y;
      if (spec.result) block(spec.result, 16, HUB_GOLD, { fontStyle: '800' }, 0);
      y = Math.max(y, before + 25) + 8;
    }
    if (spec.note) block(spec.note, 12, HUB_SUBTLE, {}, 0);

    // Keys
    y += 16;
    const keys = spec.buttons.map((b) => this.makeKey(b));
    const gap = 10;
    const rows: { keys: ReturnType<BlobPanel['makeKey']>[]; w: number; h: number }[] = [];
    for (const key of keys) {
      const row = rows[rows.length - 1];
      if (row && row.w + gap + key.width <= innerW) {
        row.keys.push(key);
        row.w += gap + key.width;
        row.h = Math.max(row.h, key.height);
      } else {
        rows.push({ keys: [key], w: key.width, h: key.height });
      }
    }
    for (const row of rows) {
      let x = -row.w / 2;
      for (const key of row.keys) {
        key.container.setPosition(x + key.width / 2, y + row.h / 2);
        items.push(key.container);
        x += key.width + gap;
      }
      y += row.h + KEY_DEPTH + gap;
    }
    y -= gap;

    const panelH = Math.max(120, y + m.padY);
    const dpr = dprOf();
    scene.textures.addCanvas(this.textureKey, paintPanelFace(m.width, panelH, dpr));
    const face = scene.add
      .image(0, 0, this.textureKey)
      .setDisplaySize(m.width + SHADOW_PAD * 2, panelH + SHADOW_PAD * 2);

    const root = scene.add.container(viewW / 2, viewH / 2, [face]).setDepth(DEPTH);
    for (const item of items) {
      // Content was laid out from the panel's top edge; shift it to be centred on the container.
      const obj = item as Phaser.GameObjects.GameObject & { y: number };
      obj.y -= panelH / 2;
      root.add(item);
    }
    this.root = root;
  };

  /** A chunky 3D key. The hit target is a separate invisible rectangle so every state redraws freely. */
  private makeKey(button: BlobPanelButton): { container: Phaser.GameObjects.Container; width: number; height: number } {
    const scene = this.scene;
    const size = button.choice ? 18 : 15;
    const label = this.text(button.label, size, HUB_INK_DARK, { fontStyle: '900' }).setOrigin(0.5);
    const padX = button.choice ? 14 : 19;
    const padY = button.choice ? 16 : 13;
    const width = Math.max(button.choice ? 105 : 0, Math.ceil(label.width) + padX * 2);
    const height = Math.ceil(label.height) + padY * 2 - 4;

    const art = scene.add.graphics();
    const draw = (state: 'rest' | 'hover' | 'down'): void => {
      const lift = state === 'hover' ? -1 : 0;
      const sink = state === 'down' ? KEY_DEPTH - 2 : 0;
      const depth = state === 'down' ? 2 : KEY_DEPTH;
      art.clear();
      art.fillStyle(KEY_EDGE, 1);
      art.fillRoundedRect(-width / 2, -height / 2 + lift + sink + depth, width, height, 14);
      art.fillStyle(state === 'hover' ? KEY_FACE_HOVER : KEY_FACE, 1);
      art.fillRoundedRect(-width / 2, -height / 2 + lift + sink, width, height, 14);
      label.setPosition(0, lift + sink);
    };
    draw('rest');

    const hit = scene.add
      .rectangle(0, KEY_DEPTH / 2, width, height + KEY_DEPTH, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw('hover'));
    hit.on('pointerout', () => draw('rest'));
    hit.on('pointerdown', () => draw('down'));
    hit.on('pointerup', () => {
      draw('hover');
      button.onClick();
    });

    const container = scene.add.container(0, 0, [art, label, hit]);
    return { container, width, height };
  }
}

/** The small "← Games" pill pinned top-left, above panels and the dim, like the original. */
export function createBackPill(scene: Phaser.Scene, label: string, onClick: () => void): Phaser.GameObjects.Container {
  const text = scene.add
    .text(0, 0, label.toLocaleUpperCase(), {
      fontFamily: HUB_FONT,
      fontSize: '12px',
      fontStyle: '800',
      color: HUB_PILL,
      letterSpacing: 0.7,
    })
    .setOrigin(0.5)
    .setResolution(dprOf())
    .setAlpha(0.9);
  const w = Math.ceil(text.width) + 24;
  const h = Math.ceil(text.height) + 12;

  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.28);
  bg.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, h / 2);
  bg.fillStyle(0x12253c, 0.72);
  bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  bg.lineStyle(1, 0xffffff, 0.16);
  bg.strokeRoundedRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, h / 2);

  const hit = scene.add.rectangle(0, 0, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  hit.on('pointerover', () => text.setAlpha(1));
  hit.on('pointerout', () => text.setAlpha(0.9));
  hit.on('pointerup', onClick);

  return scene.add.container(12 + w / 2, 12 + h / 2, [bg, text, hit]).setDepth(DEPTH + 10).setScrollFactor(0);
}
