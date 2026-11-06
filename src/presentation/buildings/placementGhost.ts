/**
 * Building placement ghost — clear valid/invalid colors + footprint.
 * Mobile-friendly: thick strokes, big validity badge, assumes snapped coords.
 */
import type Phaser from 'phaser';
import { MAP } from '../../config/balance';
import { getBuildingType, type BuildingTypeId } from '../../data/buildings';
import { drawBuildingSilhouette } from './buildingSilhouette';

type G = Phaser.GameObjects.Graphics;

const VALID = 0x5dce6a;
const VALID_BRIGHT = 0xb8f0c0;
const INVALID = 0xe85a5a;
const INVALID_BRIGHT = 0xffb0b0;
const GRID = 0xf0c75e;

export interface PlacementGhostOpts {
  x: number;
  y: number;
  typeId: BuildingTypeId;
  valid: boolean;
  timeMs?: number;
  /** Player accent for silhouette preview. */
  accent?: number;
}

/** Draw placement ghost at an already-snapped world point. */
export function drawPlacementGhost(g: G, opts: PlacementGhostOpts): void {
  const { x, y, typeId, valid } = opts;
  const timeMs = opts.timeMs ?? 0;
  const def = getBuildingType(typeId);
  const r = def.radius;
  const color = valid ? VALID : INVALID;
  const bright = valid ? VALID_BRIGHT : INVALID_BRIGHT;
  const pulse = 0.85 + 0.15 * Math.sin(timeMs / 160);

  // Snap cell underline (tile under the ghost)
  const t = MAP.tile;
  const cellX = Math.floor(x / t) * t;
  const cellY = Math.floor(y / t) * t;
  g.lineStyle(1.5, GRID, valid ? 0.35 : 0.2);
  g.strokeRect(cellX + 1, cellY + 1, t - 2, t - 2);

  // Soft validity wash
  g.fillStyle(color, 0.16 * pulse);
  g.fillCircle(x, y, r * 1.35);

  // Footprint square (reads clearer than circle alone on phones)
  g.lineStyle(3, color, 0.95);
  g.strokeRoundedRect(x - r, y - r, r * 2, r * 2, 6);
  g.fillStyle(color, 0.12);
  g.fillRoundedRect(x - r, y - r, r * 2, r * 2, 6);

  // Inner ring
  g.lineStyle(2, bright, 0.75 * pulse);
  g.strokeCircle(x, y, r * 0.92);

  // Building silhouette preview (tinted by validity via alpha)
  drawBuildingSilhouette(g, {
    x,
    y,
    radius: r * 0.92,
    color: def.color,
    accent: opts.accent ?? def.accent,
    typeId,
    alpha: valid ? 0.7 : 0.4,
    selected: false,
    timeMs,
  });

  // Validity badge (large for mobile)
  const badgeR = 12;
  const bx = x + r * 0.85;
  const by = y - r * 0.85;
  g.fillStyle(0x0a121c, 0.92);
  g.fillCircle(bx, by, badgeR + 2);
  g.fillStyle(color, 1);
  g.fillCircle(bx, by, badgeR);
  g.lineStyle(2, bright, 1);
  g.strokeCircle(bx, by, badgeR);

  if (valid) {
    // Check mark
    g.lineStyle(3, 0x0a121c, 1);
    g.lineBetween(bx - 5, by, bx - 1, by + 5);
    g.lineBetween(bx - 1, by + 5, bx + 6, by - 5);
  } else {
    // X mark + hatch
    g.lineStyle(3, 0x0a121c, 1);
    g.lineBetween(bx - 5, by - 5, bx + 5, by + 5);
    g.lineBetween(bx + 5, by - 5, bx - 5, by + 5);
    g.lineStyle(1.5, INVALID, 0.45);
    for (let i = -2; i <= 2; i++) {
      const o = i * 10;
      g.lineBetween(x - r + o, y - r, x - r + o + r * 0.6, y + r);
    }
  }
}
