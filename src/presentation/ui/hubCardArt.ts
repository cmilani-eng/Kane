/**
 * Canvas 2D painters for the game picker (GamePickerScene): the navy card panel with its
 * shadow, the accent glow, the page backdrop, the soft blobs, and the gradient title.
 * Canvas gives real gradients, blur and shadow, so the Phaser cards match the old DOM cards.
 * Each painter returns a canvas the scene turns into a texture.
 */

export const HUB_FONT =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const HUB_INK = '#f5f8ff';
export const HUB_INK_DARK = '#06121f';
export const HUB_MUTED = '#bdcce0';
export const HUB_SUBTLE = '#8fa7c2';
export const HUB_PILL = '#b9d8ff';
export const HUB_GOLD = '#ffe28a';
export const HUB_ACCENT = '#7be0ff';

/** Pill fills as hex + alpha, for Phaser Graphics. */
export const PILL_FILL = { color: 0x78b4ff, alpha: 0.13 } as const;
export const LIVE_FILL = { color: 0x7be0ff, alpha: 0.13 } as const;
export const GOLD_FILL = { color: 0xffe28a, alpha: 0.13 } as const;

export const CARD_RADIUS = 24;
/** Transparent margin around a painted card so its shadow and glow are not clipped. */
export const CARD_ART_PAD = 110;

function makeCanvas(w: number, h: number, dpr: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  return [canvas, ctx];
}

function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** The navy 145deg card face, a black ring, the drop shadow and the accent border. */
export function paintCardPanel(w: number, h: number, accent: string, dpr: number): HTMLCanvasElement {
  const pad = CARD_ART_PAD;
  const [canvas, ctx] = makeCanvas(w + pad * 2, h + pad * 2, dpr);
  ctx.scale(dpr, dpr);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.roundRect(pad - 4, pad - 4, w + 8, h + 8, CARD_RADIUS + 4);
  ctx.fill();

  // 145deg: top-left to bottom-right, as CSS measures it.
  const rad = (145 * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const cx = pad + w / 2;
  const cy = pad + h / 2;
  const grad = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  grad.addColorStop(0, 'rgb(18, 37, 60)');
  grad.addColorStop(1, 'rgb(8, 18, 33)');

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 80 * dpr;
  ctx.shadowOffsetY = 24 * dpr;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(pad, pad, w, h, CARD_RADIUS);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = rgba(accent, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pad + 1, pad + 1, w - 2, h - 2, CARD_RADIUS - 1);
  ctx.stroke();
  return canvas;
}

/** The accent glow behind a card. Painted strong; the scene dims it at rest and lifts it on hover. */
export function paintCardGlow(w: number, h: number, accent: string, dpr: number): HTMLCanvasElement {
  const pad = CARD_ART_PAD;
  const [canvas, ctx] = makeCanvas(w + pad * 2, h + pad * 2, dpr);
  ctx.scale(dpr, dpr);
  ctx.shadowColor = rgba(accent, 0.9);
  ctx.shadowBlur = 56 * dpr;
  ctx.fillStyle = rgba(accent, 1);
  ctx.beginPath();
  ctx.roundRect(pad, pad, w, h, CARD_RADIUS);
  ctx.fill();
  return canvas;
}

/** Night base with the magenta, cyan and gold washes of the old page background. */
export function paintBackdrop(w: number, h: number, dpr: number): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(w, h, dpr);
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#07111d';
  ctx.fillRect(0, 0, w, h);

  const wash = (px: number, py: number, color: string, alpha: number, reach: number): void => {
    ctx.save();
    ctx.translate(px * w, py * h);
    ctx.scale(1, h / w);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w * reach);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-w * 2, -w * 2, w * 4, w * 4);
    ctx.restore();
  };
  wash(0.15, 0, '#ff4fd8', 0.18, 0.55);
  wash(0.9, 0.2, '#7be0ff', 0.16, 0.5);
  wash(0.5, 1, '#ffe28a', 0.12, 0.6);
  return canvas;
}

/** A soft round blob; the scene drifts three of these behind the cards. */
export function paintBlob(size: number, color: string, dpr: number): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size, dpr);
  ctx.scale(dpr, dpr);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, rgba(color, 0.9));
  g.addColorStop(0.55, rgba(color, 0.35));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

/** The "Games" title: pink, gold, cyan and green gradient with a hard drop shadow. */
export function paintTitle(
  text: string,
  size: number,
  dpr: number,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) throw new Error('2D canvas is not available');
  const font = `900 ${size}px ${HUB_FONT}`;
  probe.font = font;
  const spacing = -1.5;
  const textW = Math.ceil(probe.measureText(text).width + spacing * text.length);
  const pad = 14;
  const width = textW + pad * 2;
  const height = Math.ceil(size * 1.25) + pad * 2;
  const [canvas, ctx] = makeCanvas(width, height, dpr);
  ctx.scale(dpr, dpr);
  ctx.font = font;
  ctx.textBaseline = 'middle';
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${spacing}px`;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillText(text, pad, height / 2 + 4);

  const g = ctx.createLinearGradient(pad, 0, pad + textW, 0);
  g.addColorStop(0, '#ff4fd8');
  g.addColorStop(0.3, '#ffd23f');
  g.addColorStop(0.62, '#7be0ff');
  g.addColorStop(1, '#9dff6a');
  ctx.fillStyle = g;
  ctx.fillText(text, pad, height / 2);
  return { canvas, width, height };
}
