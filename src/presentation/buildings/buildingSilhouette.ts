/**
 * Species-flavored building silhouettes — readable at phone distance.
 * Procedural Graphics only (no textures).
 */
import type Phaser from 'phaser';
import { getBuildingType, type BuildingTypeId } from '../../data/buildings';
import { SPECIES } from '../../data/speciesStub';

type G = Phaser.GameObjects.Graphics;

export interface BuildingDrawOpts {
  x: number;
  y: number;
  radius: number;
  color: number;
  accent: number;
  typeId: BuildingTypeId;
  alpha: number;
  selected?: boolean;
  timeMs?: number;
}

type Role = 'hall' | 'barracks' | 'ranged' | 'stable' | 'siege' | 'tower' | 'hero' | 'lab' | 'portal' | 'generic';

function roleOf(typeId: BuildingTypeId): Role {
  const def = getBuildingType(typeId);
  if (def.isMainHall) return 'hall';
  if (def.recruitsHero) return 'hero';
  switch (typeId) {
    case 'bonker_hut':
    case 'barracks':
    case 'blob_factory':
      return 'barracks';
    case 'archery_hall':
    case 'eye_nest':
      return 'ranged';
    case 'stable':
      return 'stable';
    case 'engineering_yard':
      return 'siege';
    case 'watchtower':
    case 'magic_bubble':
      return 'tower';
    case 'mushroom_lab':
    case 'mutation_pool':
    case 'royal_academy':
      return 'lab';
    case 'portal_of_chaos':
      return 'portal';
    default:
      return def.trains.length > 0 ? 'barracks' : 'generic';
  }
}

function strokeBody(
  g: G,
  x: number,
  y: number,
  r: number,
  accent: number,
  selected: boolean,
  alpha: number,
): void {
  g.lineStyle(selected ? 3 : 2.5, selected ? 0xf0c75e : accent, selected ? 1 : 0.95 * alpha);
  g.strokeRoundedRect(x - r, y - r, r * 2, r * 2, 6);
}

function drawBruteBody(g: G, opts: BuildingDrawOpts, role: Role): void {
  const { x, y, radius: r, color, accent, alpha, selected } = opts;
  const pal = SPECIES.brutes.palette;
  // Chunky irregular base
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x - r, y - r * 0.85, r * 2, r * 1.85, 4);
  g.fillStyle(0x2a3a22, alpha * 0.55);
  g.fillRect(x - r * 0.95, y + r * 0.35, r * 1.9, r * 0.55);
  // Scrap plates
  g.fillStyle(accent, alpha * 0.85);
  g.fillTriangle(x - r * 0.9, y - r * 0.2, x - r * 0.2, y - r * 1.05, x - r * 0.15, y + r * 0.1);
  g.fillTriangle(x + r * 0.9, y - r * 0.1, x + r * 0.25, y - r * 0.95, x + r * 0.1, y + r * 0.15);

  if (role === 'hall') {
    g.fillStyle(pal.accent, alpha);
    g.fillRect(x - r * 0.35, y - r * 1.35, r * 0.7, r * 0.7);
    g.fillStyle(0xd4782e, alpha);
    g.fillRect(x + r * 0.15, y - r * 1.7, r * 0.28, r * 0.7);
    g.fillCircle(x + r * 0.29, y - r * 1.75, r * 0.18);
  } else if (role === 'barracks') {
    // Door + spike roof
    g.fillStyle(0x1a2218, alpha);
    g.fillRect(x - r * 0.35, y + r * 0.05, r * 0.7, r * 0.8);
    g.fillStyle(accent, alpha);
    g.fillTriangle(x - r * 0.95, y - r * 0.4, x + r * 0.95, y - r * 0.4, x, y - r * 1.25);
  } else if (role === 'hero') {
    g.fillStyle(accent, alpha);
    g.fillCircle(x, y - r * 0.35, r * 0.55);
    g.fillStyle(0xf0c75e, alpha);
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.55;
      g.fillCircle(x + Math.cos(a) * r * 0.85, y - r * 0.2 + Math.sin(a) * r * 0.3, r * 0.16);
    }
  } else {
    g.fillStyle(accent, alpha);
    g.fillCircle(x, y - r * 0.45, r * 0.32);
  }
  strokeBody(g, x, y, r, accent, !!selected, alpha);
}

function drawNobleBody(g: G, opts: BuildingDrawOpts, role: Role): void {
  const { x, y, radius: r, color, accent, alpha, selected } = opts;
  const silver = SPECIES.nobles.palette.silver ?? 0xc0c8d4;
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x - r, y - r, r * 2, r * 2, 3);
  // Stone band
  g.fillStyle(silver, alpha * 0.55);
  g.fillRect(x - r, y + r * 0.35, r * 2, r * 0.25);

  if (role === 'hall') {
    g.fillStyle(accent, alpha);
    g.fillTriangle(x - r * 0.85, y - r * 0.15, x + r * 0.85, y - r * 0.15, x, y - r * 1.35);
    g.fillStyle(0xf0c75e, alpha);
    g.fillRect(x - r * 0.08, y - r * 1.55, r * 0.16, r * 0.45);
    g.fillCircle(x, y - r * 1.6, r * 0.2);
    // Side towers
    g.fillStyle(color, alpha);
    g.fillRect(x - r * 1.05, y - r * 0.4, r * 0.35, r * 1.2);
    g.fillRect(x + r * 0.7, y - r * 0.4, r * 0.35, r * 1.2);
    g.fillStyle(accent, alpha);
    g.fillTriangle(x - r * 0.88, y - r * 0.4, x - r * 0.7, y - r * 0.85, x - r * 1.05, y - r * 0.4);
    g.fillTriangle(x + r * 0.88, y - r * 0.4, x + r * 0.7, y - r * 0.85, x + r * 1.05, y - r * 0.4);
  } else if (role === 'barracks') {
    g.fillStyle(accent, alpha);
    g.fillTriangle(x - r, y - r * 0.35, x + r, y - r * 0.35, x, y - r * 1.15);
    g.fillStyle(0x1a2433, alpha);
    g.fillRect(x - r * 0.3, y + r * 0.1, r * 0.6, r * 0.75);
    g.fillStyle(silver, alpha);
    g.fillRect(x - r * 0.7, y - r * 0.15, r * 0.25, r * 0.35);
    g.fillRect(x + r * 0.45, y - r * 0.15, r * 0.25, r * 0.35);
  } else if (role === 'ranged') {
    g.fillStyle(accent, alpha);
    g.fillTriangle(x - r * 0.7, y - r * 0.2, x + r * 0.7, y - r * 0.2, x, y - r * 1.3);
    g.fillStyle(silver, alpha);
    g.fillRect(x - r * 0.08, y - r * 0.9, r * 0.16, r * 0.9);
  } else if (role === 'stable') {
    g.fillStyle(accent, alpha);
    g.fillEllipse(x, y - r * 0.35, r * 1.6, r * 0.9);
    g.fillStyle(0x1a2433, alpha);
    g.fillRect(x - r * 0.4, y + r * 0.15, r * 0.8, r * 0.7);
  } else if (role === 'tower') {
    g.fillStyle(color, alpha);
    g.fillRect(x - r * 0.45, y - r * 1.1, r * 0.9, r * 2.1);
    g.fillStyle(accent, alpha);
    g.fillTriangle(x - r * 0.55, y - r * 1.1, x + r * 0.55, y - r * 1.1, x, y - r * 1.55);
  } else if (role === 'siege' || role === 'lab') {
    g.fillStyle(silver, alpha);
    g.fillCircle(x - r * 0.35, y - r * 0.2, r * 0.35);
    g.fillCircle(x + r * 0.35, y - r * 0.2, r * 0.35);
    g.fillStyle(accent, alpha);
    g.fillRect(x - r * 0.2, y - r * 0.85, r * 0.4, r * 0.55);
  } else if (role === 'hero') {
    g.fillStyle(accent, alpha);
    g.fillTriangle(x - r * 0.75, y - r * 0.2, x + r * 0.75, y - r * 0.2, x, y - r * 1.25);
    g.fillStyle(0xf0c75e, alpha);
    g.fillCircle(x, y - r * 0.55, r * 0.28);
  } else {
    g.fillStyle(accent, alpha);
    g.fillCircle(x, y - r * 0.5, r * 0.3);
  }
  strokeBody(g, x, y, r, accent, !!selected, alpha);
}

function drawWeirdoBody(g: G, opts: BuildingDrawOpts, role: Role): void {
  const { x, y, radius: r, color, accent, alpha, selected, timeMs = 0 } = opts;
  const pink = SPECIES.weirdos.palette.pink ?? 0xe87aa8;
  const pulse = 0.85 + 0.15 * Math.sin(timeMs / 420);
  // Soft blob body
  g.fillStyle(color, alpha);
  g.fillEllipse(x, y + r * 0.05, r * 2.1, r * 1.85);
  g.fillStyle(accent, alpha * 0.45 * pulse);
  g.fillCircle(x, y - r * 0.15, r * 0.85);

  if (role === 'hall') {
    g.fillStyle(accent, alpha * pulse);
    g.fillCircle(x, y - r * 1.0, r * 0.4);
    g.fillStyle(pink, alpha);
    g.fillCircle(x - r * 0.55, y + r * 0.55, r * 0.28);
    g.fillCircle(x + r * 0.5, y + r * 0.65, r * 0.22);
    g.fillStyle(0xfff8e8, alpha);
    g.fillCircle(x, y - r * 0.95, r * 0.18);
    g.fillStyle(0x1a0a28, alpha);
    g.fillCircle(x + r * 0.05, y - r * 0.92, r * 0.08);
  } else if (role === 'barracks') {
    g.fillStyle(pink, alpha);
    g.fillEllipse(x, y - r * 0.55, r * 1.4, r * 0.7);
    g.fillStyle(0x1a0a28, alpha);
    g.fillEllipse(x, y + r * 0.25, r * 0.7, r * 0.55);
  } else if (role === 'ranged') {
    // Eye stalk
    g.fillStyle(accent, alpha);
    g.fillRect(x - r * 0.12, y - r * 1.1, r * 0.24, r * 0.9);
    g.fillStyle(0xfff8e8, alpha);
    g.fillCircle(x, y - r * 1.15, r * 0.38);
    g.fillStyle(0x1a0a28, alpha);
    g.fillCircle(x + r * 0.08, y - r * 1.12, r * 0.14);
  } else if (role === 'lab') {
    g.fillStyle(pink, alpha * pulse);
    g.fillCircle(x - r * 0.4, y - r * 0.55, r * 0.32);
    g.fillStyle(accent, alpha);
    g.fillCircle(x + r * 0.4, y - r * 0.45, r * 0.28);
    g.fillStyle(0x6ecfbf, alpha);
    g.fillCircle(x, y - r * 0.9, r * 0.22);
  } else if (role === 'portal' || role === 'hero') {
    g.lineStyle(3, accent, alpha * pulse);
    g.strokeCircle(x, y - r * 0.2, r * 0.75);
    g.fillStyle(pink, alpha * 0.5);
    g.fillCircle(x, y - r * 0.2, r * 0.45);
    g.fillStyle(0xfff8e8, alpha * 0.7);
    g.fillCircle(x, y - r * 0.2, r * 0.2);
  } else if (role === 'tower') {
    g.fillStyle(accent, alpha);
    g.fillEllipse(x, y - r * 0.7, r * 0.9, r * 1.4);
    g.fillStyle(pink, alpha * pulse);
    g.fillCircle(x, y - r * 1.2, r * 0.28);
  } else {
    g.fillStyle(accent, alpha);
    g.fillCircle(x, y - r * 0.5, r * 0.35);
  }

  g.lineStyle(selected ? 3 : 2.5, selected ? 0xf0c75e : accent, selected ? 1 : 0.9 * alpha);
  g.strokeEllipse(x, y + r * 0.05, r * 2.1, r * 1.85);
}

/** Draw one building silhouette. */
export function drawBuildingSilhouette(g: G, opts: BuildingDrawOpts): void {
  const { x, y, radius: r, alpha } = opts;
  const def = getBuildingType(opts.typeId);
  const role = roleOf(opts.typeId);

  // Contact shadow
  g.fillStyle(0x000000, 0.28 * alpha);
  g.fillEllipse(x, y + r * 0.85, r * 1.65, r * 0.5);

  if (def.speciesId === 'brutes') drawBruteBody(g, opts, role);
  else if (def.speciesId === 'nobles') drawNobleBody(g, opts, role);
  else drawWeirdoBody(g, opts, role);
}
