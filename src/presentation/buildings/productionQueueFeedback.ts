/**
 * Building production queue feedback — progress bar + queue icons.
 * Readable at phone distance; procedural Graphics only.
 */
import type Phaser from 'phaser';
import { getUnitType, type UnitTypeId } from '../../data/units';
import type { BattlefieldBuilding } from '../../gameplay/battlefield/battlefieldWorld';

type G = Phaser.GameObjects.Graphics;

const MAX_ICONS = 5;

/** Draw train progress + queued unit icons under a producing building. */
export function drawProductionQueueFeedback(
  g: G,
  b: BattlefieldBuilding,
  timeMs = 0,
): void {
  if (!b.complete || b.hp <= 0 || b.trainQueue.length === 0) return;

  const head = b.trainQueue[0]!;
  const udef = getUnitType(head);
  const pct = Math.min(1, Math.max(0, b.trainProgressMs / udef.trainMs));
  const barW = Math.max(36, b.radius * 2.2);
  const barH = 6;
  const barX = b.x - barW / 2;
  const barY = b.y + b.radius + 8;
  const accent = b.team === 'player' ? 0x7ec8ff : 0xe87aa8;
  const pulse = 0.85 + 0.15 * Math.sin(timeMs / 180);

  // Progress track
  g.fillStyle(0x0a121c, 0.88);
  g.fillRoundedRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
  g.fillStyle(0x2a3544, 1);
  g.fillRoundedRect(barX, barY, barW, barH, 2);
  g.fillStyle(accent, pulse);
  g.fillRoundedRect(barX, barY, Math.max(2, barW * pct), barH, 2);
  // Bright leading tip
  if (pct > 0.02) {
    g.fillStyle(0xffffff, 0.55 * pulse);
    g.fillRect(barX + barW * pct - 2, barY, 2, barH);
  }

  // Queue icons row (current + waiting)
  const iconR = 7;
  const gap = 4;
  const shown = Math.min(MAX_ICONS, b.trainQueue.length);
  const overflow = b.trainQueue.length - shown;
  const rowW =
    shown * (iconR * 2) + (shown - 1) * gap + (overflow > 0 ? iconR * 2 + gap : 0);
  let ix = b.x - rowW / 2 + iconR;
  const iy = barY + barH + 12;

  for (let i = 0; i < shown; i++) {
    const id = b.trainQueue[i]!;
    const active = i === 0;
    drawQueueIcon(g, ix, iy, iconR, id, accent, active, timeMs);
    ix += iconR * 2 + gap;
  }
  if (overflow > 0) {
    // Compact "+N" pip
    g.fillStyle(0x1a2430, 0.95);
    g.fillRoundedRect(ix - iconR, iy - iconR, iconR * 2, iconR * 2, 3);
    g.lineStyle(1.5, accent, 0.9);
    g.strokeRoundedRect(ix - iconR, iy - iconR, iconR * 2, iconR * 2, 3);
    g.fillStyle(accent, 1);
    // Three dots instead of text
    g.fillCircle(ix - 3.5, iy, 1.4);
    g.fillCircle(ix, iy, 1.4);
    g.fillCircle(ix + 3.5, iy, 1.4);
  }
}

function drawQueueIcon(
  g: G,
  x: number,
  y: number,
  r: number,
  typeId: UnitTypeId,
  accent: number,
  active: boolean,
  timeMs: number,
): void {
  const def = getUnitType(typeId);
  const scale = active ? 1 + 0.08 * Math.sin(timeMs / 140) : 0.92;
  const rr = r * scale;
  const fill = def.canGather
    ? 0xf0c75e
    : def.isHero
      ? 0xe87aa8
      : accent;
  const alpha = active ? 1 : 0.72;

  g.fillStyle(0x0a121c, 0.9);
  g.fillRoundedRect(x - rr - 1, y - rr - 1, rr * 2 + 2, rr * 2 + 2, 3);
  g.lineStyle(active ? 2 : 1.2, active ? 0xffffff : accent, active ? 0.95 : 0.55);
  g.strokeRoundedRect(x - rr - 1, y - rr - 1, rr * 2 + 2, rr * 2 + 2, 3);

  g.fillStyle(fill, alpha);
  if (def.canGather) {
    g.fillCircle(x, y, rr * 0.55);
  } else if (def.isHero) {
    g.fillTriangle(x, y - rr * 0.7, x + rr * 0.65, y + rr * 0.55, x - rr * 0.65, y + rr * 0.55);
    g.fillStyle(0xfff0c8, alpha * 0.9);
    g.fillCircle(x, y - rr * 0.15, rr * 0.22);
  } else if (def.shape === 'triangle' || (def.range ?? 0) > 80) {
    g.fillTriangle(x, y - rr * 0.65, x + rr * 0.6, y + rr * 0.5, x - rr * 0.6, y + rr * 0.5);
  } else {
    g.fillRoundedRect(x - rr * 0.5, y - rr * 0.5, rr, rr, 2);
  }
}
