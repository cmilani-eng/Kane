/**
 * Building placement ghost — clear valid/invalid colors + tile footprint.
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
const UNAFFORD = 0xf0c75e;

export interface PlacementGhostOpts {
  x: number;
  y: number;
  typeId: BuildingTypeId;
  valid: boolean;
  /** Wallet can cover gold + crystals (spatial validity may still be true). */
  affordable?: boolean;
  timeMs?: number;
  /** Player accent for silhouette preview. */
  accent?: number;
}

/** Tile-aligned AABB covering a circular building radius. */
export function footprintCells(
  x: number,
  y: number,
  radius: number,
): { x0: number; y0: number; cols: number; rows: number } {
  const t = MAP.tile;
  const left = x - radius;
  const right = x + radius;
  const top = y - radius;
  const bottom = y + radius;
  const c0 = Math.floor(left / t);
  const c1 = Math.floor((right - 0.01) / t);
  const r0 = Math.floor(top / t);
  const r1 = Math.floor((bottom - 0.01) / t);
  return {
    x0: c0 * t,
    y0: r0 * t,
    cols: Math.max(1, c1 - c0 + 1),
    rows: Math.max(1, r1 - r0 + 1),
  };
}

/** Tile cols×rows for a building type (placement HUD / ghost). */
export function placementFootprintSize(typeId: BuildingTypeId): {
  cols: number;
  rows: number;
} {
  const r = getBuildingType(typeId).radius;
  const fp = footprintCells(0, 0, r);
  return { cols: fp.cols, rows: fp.rows };
}

/** Draw placement ghost at an already-snapped world point. */
export function drawPlacementGhost(g: G, opts: PlacementGhostOpts): void {
  const { x, y, typeId, valid } = opts;
  const affordable = opts.affordable !== false;
  const timeMs = opts.timeMs ?? 0;
  const def = getBuildingType(typeId);
  const r = def.radius;
  const ok = valid && affordable;
  const color = !valid ? INVALID : affordable ? VALID : UNAFFORD;
  const bright = !valid
    ? INVALID_BRIGHT
    : affordable
      ? VALID_BRIGHT
      : 0xffe6a0;
  const pulse = 0.85 + 0.15 * Math.sin(timeMs / 160);

  const fp = footprintCells(x, y, r);
  const t = MAP.tile;

  // Occupied tile wash — true footprint under the building
  for (let row = 0; row < fp.rows; row++) {
    for (let col = 0; col < fp.cols; col++) {
      const cx = fp.x0 + col * t;
      const cy = fp.y0 + row * t;
      g.fillStyle(color, (ok ? 0.18 : 0.14) * pulse);
      g.fillRect(cx + 1, cy + 1, t - 2, t - 2);
      g.lineStyle(1.25, GRID, ok ? 0.45 : 0.28);
      g.strokeRect(cx + 1, cy + 1, t - 2, t - 2);
    }
  }

  // Outer footprint outline (tile-aligned AABB)
  g.lineStyle(3.5, color, 0.95);
  g.strokeRect(fp.x0, fp.y0, fp.cols * t, fp.rows * t);

  // Soft validity wash
  g.fillStyle(color, 0.12 * pulse);
  g.fillCircle(x, y, r * 1.25);

  // Inner ring
  g.lineStyle(2, bright, 0.75 * pulse);
  g.strokeCircle(x, y, r * 0.92);

  // Building silhouette preview
  drawBuildingSilhouette(g, {
    x,
    y,
    radius: r * 0.92,
    color: def.color,
    accent: opts.accent ?? def.accent,
    typeId,
    alpha: ok ? 0.72 : 0.4,
    selected: false,
    timeMs,
  });

  // Validity / affordability badge
  const badgeR = 12;
  const bx = x + r * 0.85;
  const by = y - r * 0.85;
  g.fillStyle(0x0a121c, 0.92);
  g.fillCircle(bx, by, badgeR + 2);
  g.fillStyle(color, 1);
  g.fillCircle(bx, by, badgeR);
  g.lineStyle(2, bright, 1);
  g.strokeCircle(bx, by, badgeR);

  if (ok) {
    g.lineStyle(3, 0x0a121c, 1);
    g.lineBetween(bx - 5, by, bx - 1, by + 5);
    g.lineBetween(bx - 1, by + 5, bx + 6, by - 5);
  } else if (!affordable && valid) {
    // Coin slash — need resources
    g.lineStyle(2.5, 0x0a121c, 1);
    g.strokeCircle(bx, by, 5);
    g.lineBetween(bx - 6, by + 6, bx + 6, by - 6);
  } else {
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
