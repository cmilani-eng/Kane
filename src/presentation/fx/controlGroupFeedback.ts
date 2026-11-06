/**
 * Control group assign/recall visual feedback — rings + slot pip.
 */
import type Phaser from 'phaser';
import type { ControlGroupFx } from '../../gameplay/battlefield/battlefieldControlGroupFx';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

export function drawControlGroupFxList(
  g: G,
  list: ControlGroupFx[],
  view?: ViewBounds | null,
): void {
  for (const fx of list) {
    if (view && !inView(view, fx.x, fx.y)) continue;
    const t = Math.max(0.05, fx.lifeMs / fx.maxLifeMs);
    const expand = 0.8 + (1 - t) * 0.75;
    const r = fx.radius * expand;
    const a = t;

    g.fillStyle(fx.color, a * 0.16);
    g.fillCircle(fx.x, fx.y, r * 0.5);
    g.lineStyle(fx.kind === 'assign' ? 3.5 : 2.5, fx.color, a);
    g.strokeCircle(fx.x, fx.y, r);
    g.lineStyle(1.5, 0xffffff, a * 0.65);
    g.strokeCircle(fx.x, fx.y, r * (fx.kind === 'assign' ? 0.62 : 0.72));

    // Slot badge above unit
    const bx = fx.x;
    const by = fx.y - r * 0.85 - 8;
    const br = 9;
    g.fillStyle(0x0a121c, a * 0.92);
    g.fillCircle(bx, by, br + 1);
    g.fillStyle(fx.color, a);
    g.fillCircle(bx, by, br);
    // Digit as pip row (0–9) — 0 uses a ring
    drawSlotGlyph(g, bx, by, fx.slot, a);
  }
}

function drawSlotGlyph(
  g: G,
  x: number,
  y: number,
  slot: number,
  a: number,
): void {
  g.fillStyle(0x0a121c, a);
  if (slot === 0) {
    g.lineStyle(2, 0x0a121c, a);
    g.strokeCircle(x, y, 3.5);
    return;
  }
  // Compact tally: up to 9 dots in a 3×3
  const n = Math.min(9, slot);
  const cols = 3;
  const step = 3.2;
  const rows = Math.ceil(n / cols);
  const ox = x - ((Math.min(cols, n) - 1) * step) / 2;
  const oy = y - ((rows - 1) * step) / 2;
  for (let i = 0; i < n; i++) {
    const cx = ox + (i % cols) * step;
    const cy = oy + Math.floor(i / cols) * step;
    g.fillCircle(cx, cy, 1.35);
  }
}
