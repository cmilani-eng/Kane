/**
 * Resource node silhouettes — Gold vs Magic Crystal readable at phone distance.
 * Procedural Graphics only. Distinct shapes: mound of nuggets vs angular shards.
 */
import type Phaser from 'phaser';
import type { ResourceId } from '../../data/resources';
import { RESOURCES } from '../../data/resources';

type G = Phaser.GameObjects.Graphics;

export interface ResourceNodeDrawOpts {
  x: number;
  y: number;
  radius: number;
  resourceId: ResourceId;
  /** 0–1 remaining fraction; dims depleted nodes. */
  remainingPct: number;
}

/** Draw a map resource node. Gold = round nugget pile; crystals = sharp shards. */
export function drawResourceNodeSilhouette(
  g: G,
  opts: ResourceNodeDrawOpts,
): void {
  const { x, y, radius: r, resourceId, remainingPct } = opts;
  const pct = Math.max(0.15, Math.min(1, remainingPct));
  const def = RESOURCES[resourceId];
  // Soft ground contact shadow (shared)
  g.fillStyle(0x000000, 0.28 * pct);
  g.fillEllipse(x, y + r * 0.62, r * 1.55, r * 0.42);

  if (resourceId === 'magic_crystals') {
    drawCrystalShards(g, x, y, r, def.color, pct);
  } else {
    drawGoldNuggets(g, x, y, r, def.color, pct);
  }
}

/** Chunky irregular gold mound — reads as a pile, not a blue triangle. */
function drawGoldNuggets(
  g: G,
  x: number,
  y: number,
  r: number,
  color: number,
  pct: number,
): void {
  const a = 0.55 + 0.45 * pct;

  // Warm under-glow so the pile pops on dark grass
  g.fillStyle(0xd4782e, 0.22 * pct);
  g.fillEllipse(x, y + r * 0.15, r * 1.35, r * 0.7);

  // Base nugget row (wide)
  g.fillStyle(0xb8862e, a * 0.95);
  g.fillCircle(x - r * 0.55, y + r * 0.25, r * 0.55);
  g.fillCircle(x + r * 0.5, y + r * 0.3, r * 0.48);
  g.fillCircle(x, y + r * 0.35, r * 0.5);

  // Mid mound
  g.fillStyle(color, a);
  g.fillCircle(x - r * 0.28, y - r * 0.05, r * 0.58);
  g.fillCircle(x + r * 0.32, y, r * 0.52);
  g.fillCircle(x + r * 0.05, y - r * 0.28, r * 0.48);

  // Crevice shadow between nuggets (depth cue)
  g.fillStyle(0x5a3a12, a * 0.45);
  g.fillEllipse(x - r * 0.05, y + r * 0.05, r * 0.35, r * 0.18);
  g.fillEllipse(x + r * 0.35, y + r * 0.15, r * 0.22, r * 0.12);

  // Bright crown nugget
  g.fillStyle(0xffe6a0, a);
  g.fillCircle(x - r * 0.05, y - r * 0.45, r * 0.38);
  g.fillStyle(0xfff8d8, a * 0.95);
  g.fillCircle(x - r * 0.12, y - r * 0.55, r * 0.16);

  // Specular glints (phone-readable sparkle without looking like crystals)
  g.fillStyle(0xffffff, 0.7 * pct);
  g.fillCircle(x - r * 0.2, y - r * 0.62, r * 0.08);
  g.fillCircle(x + r * 0.42, y - r * 0.12, r * 0.06);

  // Soft oval rim — hugs the mound, not a hard select-ring look
  g.lineStyle(2.5, 0xffe08a, 0.75 * pct);
  g.strokeEllipse(x, y + r * 0.05, r * 1.25, r * 0.95);
}

/** Tall angular crystal cluster — never reads as round gold. */
function drawCrystalShards(
  g: G,
  x: number,
  y: number,
  r: number,
  color: number,
  pct: number,
): void {
  const a = 0.5 + 0.5 * pct;

  // Cool bloom under shards
  g.fillStyle(0x4a90c8, 0.28 * pct);
  g.fillEllipse(x, y + r * 0.35, r * 1.2, r * 0.55);

  // Left lean shard
  g.fillStyle(0x4a9ad4, a * 0.9);
  g.fillTriangle(
    x - r * 0.75,
    y + r * 0.7,
    x - r * 0.15,
    y - r * 0.55,
    x - r * 0.05,
    y + r * 0.55,
  );

  // Right lean shard
  g.fillStyle(0x6ab8e8, a * 0.85);
  g.fillTriangle(
    x + r * 0.8,
    y + r * 0.65,
    x + r * 0.2,
    y - r * 0.45,
    x - r * 0.05,
    y + r * 0.5,
  );

  // Central tall primary shard
  g.fillStyle(color, a);
  g.fillTriangle(
    x,
    y - r * 1.15,
    x + r * 0.55,
    y + r * 0.75,
    x - r * 0.55,
    y + r * 0.75,
  );

  // Facet highlight (inner lighter shard)
  g.fillStyle(0xcfe9ff, a * 0.95);
  g.fillTriangle(
    x - r * 0.05,
    y - r * 0.75,
    x + r * 0.22,
    y + r * 0.35,
    x - r * 0.28,
    y + r * 0.35,
  );

  // Tip spark
  g.fillStyle(0xffffff, 0.9 * pct);
  g.fillTriangle(
    x,
    y - r * 1.05,
    x + r * 0.12,
    y - r * 0.55,
    x - r * 0.12,
    y - r * 0.55,
  );

  // Angular outline — reinforces "shard" vs gold oval
  g.lineStyle(2.2, 0xb8e0ff, 0.9 * pct);
  g.strokeTriangle(
    x,
    y - r * 1.15,
    x + r * 0.55,
    y + r * 0.75,
    x - r * 0.55,
    y + r * 0.75,
  );
  g.lineStyle(1.6, 0x8ec8ff, 0.55 * pct);
  g.beginPath();
  g.moveTo(x - r * 0.75, y + r * 0.7);
  g.lineTo(x - r * 0.15, y - r * 0.55);
  g.lineTo(x - r * 0.05, y + r * 0.55);
  g.closePath();
  g.strokePath();
}
