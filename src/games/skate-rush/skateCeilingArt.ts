/**
 * Skate Rush 3 — the low ceilings, drawn in the same flat cartoon style as the rest.
 * All three say the same thing without words: something sharp reaches down to the same line,
 * and road signs at the front allow one jump and cross out two.
 *
 * Called by: src/games/skate-rush/skateArt.ts
 */
import { CEILING_Y, type CeilingType, type Item } from './skateRules';

type Ctx = CanvasRenderingContext2D;

const FULL = Math.PI * 2;
/**
 * Where the teeth, beams and spikes end. The skater turns while jumping, and as drawn never gets
 * above y 134 on a single jump (any deck), yet is always above y 130 when a second jump hits. So
 * a safe jump never looks as if it touched, and a fatal one always does.
 */
const TIP_Y = CEILING_Y - 2;

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number): void {
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
}

/** A steel overpass with the ground's own spikes turned upside down under it. */
function drawBridge(ctx: Ctx, x: number, w: number): void {
  const deck = TIP_Y - 16;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
  ctx.fillRect(x, 0, w, deck);

  // Cross-braced posts, so the whole height reads as solid steel.
  const bays = Math.max(2, Math.round(w / 90));
  const bay = (w - 10) / bays;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < bays; i++) {
    const left = x + 5 + i * bay;
    line(ctx, left, 34, left + bay, deck - 18);
    line(ctx, left, deck - 18, left + bay, 34);
  }
  ctx.stroke();
  ctx.fillStyle = '#475569';
  for (let i = 0; i <= bays; i++) ctx.fillRect(x + i * bay, 0, 10, deck);
  ctx.fillRect(x, 28, w, 7);

  // Girder with yellow and black warning stripes.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, deck - 18, w, 18);
  ctx.clip();
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x, deck - 18, w, 18);
  ctx.fillStyle = '#111827';
  for (let sx = x - 18; sx < x + w; sx += 30) {
    ctx.beginPath();
    ctx.moveTo(sx, deck);
    ctx.lineTo(sx + 15, deck);
    ctx.lineTo(sx + 33, deck - 18);
    ctx.lineTo(sx + 18, deck - 18);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#dbeafe';
  const teeth = Math.max(1, Math.round(w / 25));
  const tooth = w / teeth;
  ctx.beginPath();
  ctx.moveTo(x, deck);
  for (let i = 0; i < teeth; i++) {
    ctx.lineTo(x + (i + 0.5) * tooth, TIP_Y);
    ctx.lineTo(x + (i + 1) * tooth, deck);
  }
  ctx.fill();
}

/** A hanging rig of red beams, closed off along the bottom by one bright one. */
function drawLaserNet(ctx: Ctx, x: number, w: number, frame: number): void {
  ctx.fillStyle = 'rgba(127, 29, 29, 0.3)';
  ctx.fillRect(x, 0, w, TIP_Y);

  ctx.shadowColor = '#fb174d';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#fb174d';
  ctx.globalAlpha = 0.7 + Math.sin(frame * 0.3) * 0.15;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const beams = Math.max(1, Math.round((w - 16) / 24));
  for (let i = 1; i < beams; i++) {
    const bx = x + 8 + (i * (w - 16)) / beams;
    line(ctx, bx, 14, bx, TIP_Y - 8);
  }
  line(ctx, x + 8, 48, x + w - 8, 48);
  line(ctx, x + 8, 82, x + w - 8, 82);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fb174d';
  ctx.fillRect(x + 5, TIP_Y - 9, w - 10, 9);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(x, 0, 8, TIP_Y);
  ctx.fillRect(x + w - 8, 0, 8, TIP_Y);
  ctx.fillRect(x, 0, w, 14);
}

/** A stone ceiling with spiked balls on chains, packed too closely to slip between. */
function drawMaces(ctx: Ctx, x: number, w: number, frame: number): void {
  ctx.fillStyle = 'rgba(28, 25, 23, 0.45)';
  ctx.fillRect(x, 0, w, TIP_Y);

  const radius = 13;
  const reach = radius + 7;
  const balls = Math.max(1, Math.round((w - reach * 2) / 32) + 1);
  const gap = balls > 1 ? (w - reach * 2) / (balls - 1) : 0;
  for (let i = 0; i < balls; i++) {
    // A little sideways rattle; the lowest point stays put.
    const bx = x + reach + i * gap + Math.sin(frame * 0.12 + i) * 1.5;
    const by = TIP_Y - reach;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    line(ctx, x + reach + i * gap, 30, bx, by - radius);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    for (let point = 0; point < 16; point++) {
      const angle = (point / 16) * FULL + Math.PI / 2;
      const r = point % 2 === 0 ? reach : radius - 6;
      ctx.lineTo(bx + Math.cos(angle) * r, by + Math.sin(angle) * r);
    }
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(bx, by, radius - 3, 0, FULL);
    ctx.fill();
  }

  ctx.fillStyle = '#78716c';
  ctx.fillRect(x, 0, w, 32);
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  line(ctx, x, 16, x + w, 16);
  for (let bx = 22; bx < w; bx += 44) {
    line(ctx, x + bx, 0, x + bx, 16);
    if (bx + 22 < w) line(ctx, x + bx + 22, 16, x + bx + 22, 32);
  }
  ctx.stroke();
}

function roundSign(ctx: Ctx, cx: number, cy: number, ring: string): void {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, FULL);
  ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 5;
  ctx.stroke();
}

/** One up-arrowhead per jump, each with its tip at the given height. */
function chevrons(ctx: Ctx, cx: number, tips: readonly number[]): void {
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 4;
  for (const tip of tips) {
    ctx.beginPath();
    ctx.moveTo(cx - 10, tip + 8);
    ctx.lineTo(cx, tip);
    ctx.lineTo(cx + 10, tip + 8);
    ctx.stroke();
  }
}

/** A pair of road signs: one jump yes, two jumps no. */
function drawJumpSigns(ctx: Ctx, x: number, y: number): void {
  roundSign(ctx, x, y, '#16a34a');
  chevrons(ctx, x, [y - 5]);

  const no = x + 48;
  roundSign(ctx, no, y, '#dc2626');
  chevrons(ctx, no, [y - 11, y + 2]);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.beginPath();
  line(ctx, no - 14, y - 14, no + 14, y + 14);
  ctx.stroke();
}

export function drawCeiling(ctx: Ctx, type: CeilingType, o: Item, frame: number): void {
  if (type === 'bridge') drawBridge(ctx, o.x, o.w);
  else if (type === 'lasernet') drawLaserNet(ctx, o.x, o.w, frame);
  else drawMaces(ctx, o.x, o.w, frame);
  // The signs lead the way in; a long ceiling repeats them, for a skater already underneath.
  drawJumpSigns(ctx, o.x + 36, 62);
  if (o.w > 460) drawJumpSigns(ctx, o.x + o.w - 84, 62);
}
